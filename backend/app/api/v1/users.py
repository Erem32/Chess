from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.user import UserRead, UserStats
from app.services import user_service

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return user_service.get_current_user_profile(current_user)


@router.get("/me/stats", response_model=UserStats)
def get_my_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserStats:
    return user_service.get_user_stats(db, current_user)
