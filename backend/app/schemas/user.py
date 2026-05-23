from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class UserStats(BaseModel):
    wins: int = 0
    losses: int = 0
    draws: int = 0
    games_played: int = 0
