from datetime import datetime

from pydantic import BaseModel

from app.schemas.game import GameRead


class MoveCreate(BaseModel):
    move_uci: str


class MoveRead(BaseModel):
    id: int
    game_id: int
    user_id: int
    move_number: int
    move_uci: str
    move_san: str | None
    fen_after_move: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MoveListResponse(BaseModel):
    game_id: int
    moves: list[MoveRead]


class GameMoveResponse(BaseModel):
    game: GameRead
    move: MoveRead
    is_checkmate: bool
    is_stalemate: bool
    is_insufficient_material: bool
