from datetime import datetime

from pydantic import BaseModel, Field


class GameRead(BaseModel):
    id: int
    status: str
    current_fen: str
    turn_color: str
    started_at: datetime | None
    finished_at: datetime | None
    result: str | None
    draw_offer_by_user_id: int | None = None
    draw_offer_created_at: datetime | None = None

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


class GameHistoryPage(GameHistoryResponse):
    next_before_id: int | None = None


class DrawClaimRequest(BaseModel):
    move_uci: str | None = Field(default=None, max_length=5)


class DrawClaimMove(BaseModel):
    uci: str
    san: str
    reasons: list[str]


class DrawClaimOptions(BaseModel):
    game_id: int
    current_reasons: list[str]
    moves: list[DrawClaimMove]


class MatchmakingResponse(BaseModel):
    status: str
    game_id: int | None = None
    game: GameDetailRead | None = None
