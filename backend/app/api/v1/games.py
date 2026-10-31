from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.game import GameDetailRead, GameHistoryResponse
from app.schemas.move import GameMoveResponse, MoveCreate, MoveListResponse
from app.services.chess_service import (
    GameAccessError,
    GameNotActiveError,
    GameNotFoundError as ChessGameNotFoundError,
    IllegalMoveError,
    NotPlayerTurnError,
    apply_player_move,
)
from app.services.game_service import (
    GameAccessDeniedError,
    GameAlreadyFinishedError,
    GameNotFoundError,
    GameService,
)

router = APIRouter()
game_service = GameService()


def _game_error_response(exc: Exception) -> HTTPException:
    if isinstance(exc, GameNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if isinstance(exc, GameAccessDeniedError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a player in this game")
    if isinstance(exc, GameAlreadyFinishedError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Game is already finished")
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected game error")


def _move_error_response(exc: Exception) -> HTTPException:
    if isinstance(exc, ChessGameNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")
    if isinstance(exc, GameAccessError):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a player in this game")
    if isinstance(exc, GameNotActiveError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Game is not active")
    if isinstance(exc, NotPlayerTurnError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="It is not this player's turn")
    if isinstance(exc, IllegalMoveError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected move error")


@router.get("/my-history", response_model=GameHistoryResponse)
def my_game_history(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameHistoryResponse:
    games = game_service.list_history_for_user(db, current_user)
    return GameHistoryResponse(games=games)


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
    games = game_service.abort_active_games_for_user(db, current_user)
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


@router.post("/{game_id}/moves", response_model=GameMoveResponse)
def create_game_move(
    game_id: int,
    payload: MoveCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GameMoveResponse:
    try:
        result = apply_player_move(db, game_id, current_user.id, payload.move_uci)
    except (
        ChessGameNotFoundError,
        GameAccessError,
        GameNotActiveError,
        IllegalMoveError,
        NotPlayerTurnError,
    ) as exc:
        raise _move_error_response(exc) from exc
    return GameMoveResponse.model_validate(result)


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
