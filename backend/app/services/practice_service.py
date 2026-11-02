"""Read server-owned exercises and validate attempts without changing games."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

import chess
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, model_validator

from app.schemas.practice import PracticeAttemptResponse, PracticeExerciseRead, PuzzleSolutionResponse
from app.services.chess_service import IllegalMoveError, apply_uci_move


PRACTICE_CONTENT_PATH = Path(__file__).resolve().parents[1] / "data" / "practice_exercises.json"


class PracticeExercise(BaseModel):
    """One authored position with one or more accepted legal UCI moves."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$")
    kind: Literal["lesson", "puzzle"] = "lesson"
    fen: str
    instruction: str = Field(min_length=1)
    accepted_moves: list[str] = Field(min_length=1)
    correct_feedback: str | None = None
    incorrect_feedback: str | None = None
    explanation: str | None = None
    solution_moves: list[str] | None = None
    rating: int | None = Field(default=None, ge=0)
    source_url: str | None = None

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
        if self.solution_moves is not None:
            if self.kind != "puzzle" or not self.solution_moves or len(self.solution_moves) % 2 != 1:
                raise ValueError("A puzzle line must end with a player move")
            if len(self.solution_moves) > 39 or self.accepted_moves != self.solution_moves[:1]:
                raise ValueError("Puzzle line must start with its accepted move and contain at most 39 plies")
            for answer in self.solution_moves:
                try:
                    move = chess.Move.from_uci(answer)
                except ValueError as exc:
                    raise ValueError("Invalid move in puzzle line") from exc
                if move not in board.legal_moves:
                    raise ValueError("Illegal move in puzzle line")
                board.push(move)
        return self


def load_exercises() -> list[PracticeExercise]:
    path = PRACTICE_CONTENT_PATH
    stat = path.stat()
    return list(_load_exercises(path, stat.st_mtime_ns, stat.st_size))


@lru_cache(maxsize=1)
def _load_exercises(path: Path, _mtime_ns: int, _size: int) -> tuple[PracticeExercise, ...]:
    definitions = TypeAdapter(list[PracticeExercise]).validate_python(
        json.loads(path.read_text(encoding="utf-8"))
    )
    if len({item.id for item in definitions}) != len(definitions):
        raise ValueError("Duplicate practice exercise ID")
    return tuple(definitions)


def list_exercises(kind: str | None = None) -> list[PracticeExerciseRead]:
    return [
        PracticeExerciseRead(id=item.id, fen=item.fen, instruction=item.instruction,
                             rating=item.rating, source_url=item.source_url)
        for item in load_exercises() if kind is None or item.kind == kind
    ]


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


def puzzle_solution(exercise: PracticeExercise) -> PuzzleSolutionResponse:
    move_uci = exercise.accepted_moves[0]
    move = apply_uci_move(exercise.fen, move_uci)
    return PuzzleSolutionResponse(move_uci=move_uci, fen=str(move["fen"]), explanation=exercise.explanation)
