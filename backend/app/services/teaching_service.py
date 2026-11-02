"""Load and validate authored, read-only teaching examples."""

import json
from pathlib import Path

import chess
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

TEACHING_PATH = Path(__file__).resolve().parents[1] / "data" / "teaching_examples.json"


class TeachingMove(BaseModel):
    model_config = ConfigDict(extra="forbid")
    move_uci: str
    explanation: str = Field(min_length=1)


class TeachingExample(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1)
    fen: str
    introduction: str = Field(min_length=1)
    moves: list[TeachingMove] = Field(min_length=1)


def load_teaching_examples() -> list[dict]:
    content = json.loads(TEACHING_PATH.read_text(encoding="utf-8"))
    examples = TypeAdapter(list[TeachingExample]).validate_python(content)
    if len({example.id for example in examples}) != len(examples):
        raise ValueError("Duplicate teaching example ID")
    result = []
    for example in examples:
        try:
            board = chess.Board(example.fen)
        except ValueError as exc:
            raise ValueError(f"Invalid teaching position: {example.id}") from exc
        if not board.is_valid():
            raise ValueError(f"Invalid teaching position: {example.id}")
        steps = [{"fen": board.fen(), "move": None, "explanation": example.introduction}]
        for item in example.moves:
            try:
                move = chess.Move.from_uci(item.move_uci)
                if move not in board.legal_moves:
                    raise ValueError("Illegal teaching move")
                san = board.san(move)
                board.push(move)
            except ValueError as exc:
                raise ValueError(f"Invalid teaching move: {example.id}: {item.move_uci}") from exc
            steps.append({"fen": board.fen(), "move": san, "explanation": item.explanation})
        result.append({"id": example.id, "title": example.title, "steps": steps})
    return result
