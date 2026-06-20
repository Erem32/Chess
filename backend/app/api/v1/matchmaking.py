from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.game import MatchmakingResponse
from app.services.matchmaking_service import MatchmakingService

router = APIRouter()
matchmaking_service = MatchmakingService()


@router.post("/join", response_model=MatchmakingResponse)
def join_matchmaking(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MatchmakingResponse:
    result = matchmaking_service.join(db, current_user)
    return MatchmakingResponse(status=result.status, game_id=result.game.id if result.game else None, game=result.game)


@router.get("/status", response_model=MatchmakingResponse)
def get_matchmaking_status(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MatchmakingResponse:
    result = matchmaking_service.status(db, current_user)
    return MatchmakingResponse(status=result.status, game_id=result.game.id if result.game else None, game=result.game)


@router.post("/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_matchmaking(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    matchmaking_service.leave(db, current_user)
