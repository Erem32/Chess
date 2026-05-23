from fastapi import APIRouter

from app.schemas.user import UserStats

router = APIRouter()


@router.get("/me")
def get_me() -> dict[str, str]:
    return {"message": "Current user endpoint scaffolded"}


@router.get("/me/stats", response_model=UserStats)
def get_my_stats() -> UserStats:
    return UserStats()
