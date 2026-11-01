from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PracticeExerciseRead(BaseModel):
    id: str
    fen: str
    instruction: str


class PracticeAttemptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    move_uci: str = Field(min_length=1, max_length=5)


class PracticeAttemptResponse(BaseModel):
    result: Literal["illegal", "incorrect", "correct"]
    fen: str
    feedback: str | None = None
