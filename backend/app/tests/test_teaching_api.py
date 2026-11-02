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
            assert [example["id"] for example in examples] == ["pawn-capture", "pawn-promotion", "knight-move"]
            for example in examples:
                board = chess.Board(example["steps"][0]["fen"])
                assert board.is_valid()
                for step in example["steps"][1:]:
                    board.push_san(step["move"])
                    assert board.fen() == step["fen"]
                    assert step["explanation"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


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
