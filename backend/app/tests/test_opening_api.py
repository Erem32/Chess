import json

import chess
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.models import User
from app.services import opening_service


@pytest.fixture()
def guide(tmp_path, monkeypatch):
    path = tmp_path / "opening.json"
    path.write_text(json.dumps({
        "title": "Test guide", "introduction": "Starting position.",
        "moves": [{"move_uci": "e2e4", "explanation": "White moves."},
                  {"move_uci": "e7e5", "explanation": "Black replies."}],
    }))
    monkeypatch.setattr(opening_service, "OPENING_GUIDE_PATH", path)
    return path


def test_opening_requires_authentication():
    with TestClient(app) as client:
        assert client.get("/api/v1/opening").status_code == 401


def test_opening_positions_and_empty_catalog(guide):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/opening")
            assert response.status_code == 200
            data = response.json()
            assert data["video_url"] is None
            assert [step["move"] for step in data["steps"]] == [None, "e4", "e5"]
            board = chess.Board()
            for step, move in zip(data["steps"][1:], ["e2e4", "e7e5"], strict=True):
                board.push_uci(move)
                assert step["fen"] == board.fen()
            guide.write_text("null")
            assert client.get("/api/v1/opening").json() is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_invalid_sequence_and_video_are_rejected(guide):
    data = json.loads(guide.read_text())
    data["moves"][1]["move_uci"] = "e7e4"
    guide.write_text(json.dumps(data))
    with pytest.raises(ValueError, match="Invalid opening move"):
        opening_service.load_opening_guide()
    data["moves"][1]["move_uci"] = "e7e5"
    data["video_url"] = "javascript:alert(1)"
    guide.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        opening_service.load_opening_guide()
