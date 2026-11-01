from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.chat import ChatHistoryResponse
from app.schemas.game import DrawClaimOptions, DrawClaimRequest, GameDetailRead, GameHistoryPage, GameHistoryResponse
from app.schemas.move import MoveListResponse
from app.services.chess_service import (
    DrawOfferError,
    GameAccessError,
    GameNotActiveError,
    GameNotFoundError as ChessGameNotFoundError,
    NotPlayerTurnError,
    claim_draw,
    draw_claim_options,
    offer_draw,
    respond_to_draw_offer,
)
from app.services.game_service import (
    GameAccessDeniedError,
    GameAlreadyFinishedError,
    GameCannotBeAbortedError,
    GameNotFoundError,
    GameService,
)

router = APIRouter()
game_service = GameService()


def _game_access_error_response(exc: Exception) -> HTTPException | None:
    if isinstance(exc, (GameNotFoundError, ChessGameNotFoundError)):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if isinstance(exc, (GameAccessDeniedError, GameAccessError)):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a player in this game")
    return None


def _game_error_response(exc: Exception) -> HTTPException:
    access_error = _game_access_error_response(exc)
    if access_error is not None:
        return access_error
    if isinstance(exc, GameAlreadyFinishedError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Game is already finished")
    if isinstance(exc, GameCannotBeAbortedError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A game can only be aborted before the first move; resign instead")
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected game error")


def _draw_error_response(exc: Exception) -> HTTPException:
    access_error = _game_access_error_response(exc)
    if access_error is not None:
        return access_error
    if isinstance(exc, GameNotActiveError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Game is not active")
    if isinstance(exc, DrawOfferError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if isinstance(exc, NotPlayerTurnError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected draw-offer error")


@router.get("/my-history", response_model=GameHistoryPage)
def my_game_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    before_id: Annotated[int | None, Query(ge=1)] = None,
) -> GameHistoryPage:
    games = game_service.list_history_for_user(db, current_user, limit + 1, before_id)
    has_more = len(games) > limit
    games = games[:limit]
    return GameHistoryPage(games=games, next_before_id=games[-1].id if has_more else None)


@router.get("/my-active", response_model=GameDetailRead | None)
def my_active_game(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead | None:
    game = game_service.get_latest_active_game_for_user(db, current_user)
    return GameDetailRead.model_validate(game) if game else None


@router.post("/my-active/abort", response_model=GameHistoryResponse)
def abort_my_active_games(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameHistoryResponse:
    try:
        games = game_service.abort_active_games_for_user(db, current_user)
    except GameCannotBeAbortedError as exc:
        raise _game_error_response(exc) from exc
    return GameHistoryResponse(games=games)


@router.get("/{game_id}", response_model=GameDetailRead)
def get_game(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        game = game_service.get_game_for_user(db, game_id, current_user)
    except (GameAccessDeniedError, GameNotFoundError) as exc:
        raise _game_error_response(exc) from exc
    return GameDetailRead.model_validate(game)


@router.get("/{game_id}/moves", response_model=MoveListResponse)
def get_game_moves(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MoveListResponse:
    try:
        moves = game_service.list_moves_for_user(db, game_id, current_user)
    except (GameAccessDeniedError, GameNotFoundError) as exc:
        raise _game_error_response(exc) from exc
    return MoveListResponse(game_id=game_id, moves=moves)


@router.get("/{game_id}/chat", response_model=ChatHistoryResponse)
def get_game_chat(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    before_id: Annotated[int | None, Query(ge=1)] = None,
) -> ChatHistoryResponse:
    try:
        messages = game_service.list_chat_for_user(db, game_id, current_user, limit, before_id)
    except (GameAccessDeniedError, GameNotFoundError) as exc:
        raise _game_error_response(exc) from exc
    return ChatHistoryResponse(game_id=game_id, messages=messages)


@router.post("/{game_id}/resign", response_model=GameDetailRead)
def resign_game(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        game = game_service.resign(db, game_id, current_user)
    except (GameAccessDeniedError, GameAlreadyFinishedError, GameNotFoundError) as exc:
        raise _game_error_response(exc) from exc
    return GameDetailRead.model_validate(game)


@router.post("/{game_id}/draw-offer", response_model=GameDetailRead)
def create_draw_offer(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        offer_draw(db, game_id, current_user.id)
        game = game_service.get_game_for_user(db, game_id, current_user)
    except (ChessGameNotFoundError, GameAccessError, GameNotActiveError, DrawOfferError) as exc:
        raise _draw_error_response(exc) from exc
    return GameDetailRead.model_validate(game)


@router.get("/{game_id}/draw-claims", response_model=DrawClaimOptions)
def get_draw_claim_options(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> DrawClaimOptions:
    try:
        return DrawClaimOptions.model_validate(draw_claim_options(db, game_id, current_user.id))
    except (ChessGameNotFoundError, GameAccessError, GameNotActiveError, NotPlayerTurnError) as exc:
        raise _draw_error_response(exc) from exc


@router.post("/{game_id}/draw-claims", response_model=GameDetailRead)
def submit_draw_claim(
    game_id: int,
    payload: DrawClaimRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        claim_draw(db, game_id, current_user.id, payload.move_uci)
        return GameDetailRead.model_validate(game_service.get_game_for_user(db, game_id, current_user))
    except (ChessGameNotFoundError, GameAccessError, GameNotActiveError, NotPlayerTurnError, DrawOfferError) as exc:
        raise _draw_error_response(exc) from exc


@router.post("/{game_id}/draw-offer/accept", response_model=GameDetailRead)
def accept_draw_offer(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        respond_to_draw_offer(db, game_id, current_user.id, accept=True)
        game = game_service.get_game_for_user(db, game_id, current_user)
    except (ChessGameNotFoundError, GameAccessError, GameNotActiveError, DrawOfferError) as exc:
        raise _draw_error_response(exc) from exc
    return GameDetailRead.model_validate(game)


@router.post("/{game_id}/draw-offer/decline", response_model=GameDetailRead)
def decline_draw_offer(
    game_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameDetailRead:
    try:
        respond_to_draw_offer(db, game_id, current_user.id, accept=False)
        game = game_service.get_game_for_user(db, game_id, current_user)
    except (ChessGameNotFoundError, GameAccessError, GameNotActiveError, DrawOfferError) as exc:
        raise _draw_error_response(exc) from exc
    return GameDetailRead.model_validate(game)
