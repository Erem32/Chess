from datetime import datetime

from pydantic import BaseModel


class GameRead(BaseModel):
    id: int
    status: str
    current_fen: str
    turn_color: str
    started_at: datetime | None
    finished_at: datetime | None
    result: str | None

    model_config = {"from_attributes": True}


class GamePlayerRead(BaseModel):
    user_id: int
    username: str | None = None
    color: str
    result: str | None

    model_config = {"from_attributes": True}


class GameDetailRead(GameRead):
    players: list[GamePlayerRead]


class GameHistoryResponse(BaseModel):
    games: list[GameDetailRead]


class MatchmakingResponse(BaseModel):
    status: str
    game_id: int | None = None
    game: GameDetailRead | None = None
