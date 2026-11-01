"""Read server-owned exercises and validate attempts without changing games."""

import json
from pathlib import Path

import chess
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator

from app.schemas.practice import PracticeAttemptResponse, PracticeExerciseRead
from app.services.chess_service import IllegalMoveError, apply_uci_move


PRACTICE_CONTENT_PATH = Path(__file__).resolve().parents[1] / "data" / "practice_exercises.json"


class PracticeExercise(BaseModel):
    """One authored position with one or more accepted legal UCI moves."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    fen: str
    instruction: str = Field(min_length=1)
    accepted_moves: list[str] = Field(min_length=1)
    correct_feedback: str | None = None
    incorrect_feedback: str | None = None

    @model_validator(mode="after")
    def validate_position_and_answers(self) -> "PracticeExercise":
        try:
            board = chess.Board(self.fen)
        except ValueError as exc:
            raise ValueError("Invalid exercise FEN") from exc
        if not board.is_valid():
            raise ValueError("Invalid exercise position")
        if len(set(self.accepted_moves)) != len(self.accepted_moves):
            raise ValueError("Duplicate accepted move")
        for answer in self.accepted_moves:
            try:
                move = chess.Move.from_uci(answer)
            except ValueError as exc:
                raise ValueError("Invalid accepted move") from exc
            if move not in board.legal_moves:
                raise ValueError("Accepted move is not legal in exercise position")
        return self


def load_exercises() -> list[PracticeExercise]:
    definitions = TypeAdapter(list[PracticeExercise]).validate_python(
        json.loads(PRACTICE_CONTENT_PATH.read_text(encoding="utf-8"))
    )
    if len({item.id for item in definitions}) != len(definitions):
        raise ValueError("Duplicate practice exercise ID")
    return definitions


def list_exercises() -> list[PracticeExerciseRead]:
    return [PracticeExerciseRead(id=item.id, fen=item.fen, instruction=item.instruction) for item in load_exercises()]


def find_exercise(exercise_id: str) -> PracticeExercise | None:
    return next((item for item in load_exercises() if item.id == exercise_id), None)


def check_attempt(exercise: PracticeExercise, move_uci: str) -> PracticeAttemptResponse:
    try:
        move = apply_uci_move(exercise.fen, move_uci)
    except IllegalMoveError:
        return PracticeAttemptResponse(result="illegal", fen=exercise.fen)
    if move_uci not in exercise.accepted_moves:
        return PracticeAttemptResponse(result="incorrect", fen=exercise.fen, feedback=exercise.incorrect_feedback)
    return PracticeAttemptResponse(result="correct", fen=str(move["fen"]), feedback=exercise.correct_feedback)
