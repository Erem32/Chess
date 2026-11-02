from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PracticeExerciseRead(BaseModel):
    id: str
    fen: str
    instruction: str
    rating: int | None = None
    source_url: str | None = None


class PracticeAttemptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    move_uci: str = Field(min_length=1, max_length=5)


class PracticeAttemptResponse(BaseModel):
    result: Literal["illegal", "incorrect", "correct"]
    fen: str
    feedback: str | None = None


class PuzzleSolutionResponse(BaseModel):
    move_uci: str
    fen: str
    explanation: str | None = None


class PuzzleProgressRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    moves: list[str] = Field(default_factory=list, max_length=20)


class PuzzleAttemptRequest(PuzzleProgressRequest):
    move_uci: str = Field(min_length=1, max_length=5)


class PuzzleAttemptResponse(BaseModel):
    result: Literal["illegal", "incorrect", "correct"]
    fen: str
    complete: bool = False
    opponent_move: str | None = None
    feedback: str | None = None


class PuzzleHintResponse(BaseModel):
    square: str
    piece: str


class PuzzleLineResponse(BaseModel):
    moves: list[str]
    fen: str
    explanation: str | None = None
