from fastapi import APIRouter

from app.api.v1 import auth, games, matchmaking, opening, practice, teaching, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(matchmaking.router, prefix="/matchmaking", tags=["matchmaking"])
api_router.include_router(games.router, prefix="/games", tags=["games"])
api_router.include_router(opening.router, prefix="/opening", tags=["opening"])
api_router.include_router(teaching.router, prefix="/teaching-examples", tags=["teaching"])
api_router.include_router(practice.router, prefix="/practice", tags=["practice"])
