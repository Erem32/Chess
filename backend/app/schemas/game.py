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
