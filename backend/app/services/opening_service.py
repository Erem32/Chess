"""Load a written opening guide and validate its illustrative moves."""

import json
from pathlib import Path

import chess
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, TypeAdapter

OPENING_GUIDE_PATH = Path(__file__).resolve().parents[1] / "data" / "opening_guide.json"


class OpeningMove(BaseModel):
    model_config = ConfigDict(extra="forbid")
    move_uci: str
    explanation: str = Field(min_length=1)


class OpeningGuide(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1)
    introduction: str = Field(min_length=1)
    moves: list[OpeningMove] = Field(min_length=1)
    video_url: HttpUrl | None = None


def load_opening_guide() -> dict | None:
    content = json.loads(OPENING_GUIDE_PATH.read_text(encoding="utf-8"))
    guide = TypeAdapter(OpeningGuide | None).validate_python(content)
    if guide is None:
        return None
    board = chess.Board()
    steps = [{"fen": board.fen(), "move": None, "explanation": guide.introduction}]
    for item in guide.moves:
        try:
            move = chess.Move.from_uci(item.move_uci)
            if move not in board.legal_moves:
                raise ValueError("Illegal opening move")
            san = board.san(move)
            board.push(move)
        except ValueError as exc:
            raise ValueError(f"Invalid opening move: {item.move_uci}") from exc
        steps.append({"fen": board.fen(), "move": san, "explanation": item.explanation})
    return {"title": guide.title, "video_url": str(guide.video_url) if guide.video_url else None, "steps": steps}
