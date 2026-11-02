import json

import chess
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.models import User
from app.services import teaching_service


def test_teaching_requires_authentication():
    with TestClient(app) as client:
        assert client.get("/api/v1/teaching-examples").status_code == 401


def test_authored_examples_are_legal_and_available():
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/teaching-examples")
            assert response.status_code == 200
            examples = response.json()
            assert len(examples) == 25
            assert {example["category"] for example in examples} == {
                "Piece movement", "Special moves", "King safety", "Tactical patterns", "Planning and endgames"
            }
            for example in examples:
                board = chess.Board(example["steps"][0]["fen"])
                assert board.is_valid() and not board.is_game_over()
                for step in example["steps"][1:]:
                    board.push_san(step["move"])
                    assert board.fen() == step["fen"]
                    assert step["explanation"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_named_examples_really_show_those_chess_ideas():
    examples = {item["id"]: item for item in teaching_service.load_teaching_examples()}

    def board_after(example_id, count=None):
        steps = examples[example_id]["steps"]
        board = chess.Board(steps[0]["fen"])
        for step in steps[1:count + 1 if count is not None else None]:
            board.push_san(step["move"])
        return board

    for example_id in ("checkmate-net", "back-rank-mate", "scholars-mate", "underpromotion"):
        assert board_after(example_id).is_checkmate()
    assert board_after("stalemate").is_stalemate()

    for example_id in ("castle-kingside", "castle-queenside"):
        example = examples[example_id]
        board = chess.Board(example["steps"][0]["fen"])
        assert board.is_castling(board.parse_san(example["steps"][1]["move"]))
    example = examples["en-passant"]
    board = chess.Board(example["steps"][0]["fen"])
    assert board.is_en_passant(board.parse_san(example["steps"][1]["move"]))

    fork = board_after("knight-fork", 1)
    assert fork.is_check() and chess.C7 in fork.attacks(chess.E6)
    assert not board_after("knight-fork").is_insufficient_material()
    assert board_after("absolute-pin", 1).is_pinned(chess.BLACK, chess.C6)
    block = board_after("block-a-check", 1)
    assert chess.C4 in block.attackers(chess.WHITE, chess.E3)
    assert board_after("block-a-check").piece_at(chess.E3) == chess.Piece(chess.KNIGHT, chess.WHITE)


@pytest.mark.parametrize("failure", ["fen", "move", "duplicate"])
def test_invalid_teaching_content_is_rejected(tmp_path, monkeypatch, failure):
    content = json.loads(teaching_service.TEACHING_PATH.read_text())
    if failure == "fen":
        content[0]["fen"] = "invalid"
    elif failure == "move":
        content[0]["moves"][0]["move_uci"] = "e4e8"
    else:
        content[1]["id"] = content[0]["id"]
    path = tmp_path / "examples.json"
    path.write_text(json.dumps(content))
    monkeypatch.setattr(teaching_service, "TEACHING_PATH", path)
    with pytest.raises(ValueError):
        teaching_service.load_teaching_examples()
