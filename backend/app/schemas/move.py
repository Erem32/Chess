from datetime import datetime

from pydantic import BaseModel


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
