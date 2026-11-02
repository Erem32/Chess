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


def test_opening_catalog_requires_authentication():
    with TestClient(app) as client:
        assert client.get("/api/v1/opening/catalog").status_code == 401


def test_opening_catalog_has_legal_complete_guides():
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/opening/catalog")
            assert response.status_code == 200
            guides = response.json()
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert len(guides) == 20
    assert len({guide["id"] for guide in guides}) == len(guides)
    italian = next(guide for guide in guides if guide["id"] == "italian-game")
    assert italian["title"] == "Italian Game"
    assert [step["move"] for step in italian["steps"][1:7]] == ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"]
    for guide in guides:
        assert 10 <= len(guide["steps"]) - 1 <= 16
        assert (len(guide["steps"]) - 1) % 2 == 0
        assert guide["introduction"] and guide["ideas"]
        board = chess.Board()
        assert guide["steps"][0]["fen"] == board.fen()
        for step in guide["steps"][1:]:
            board.push_san(step["move"])
            assert step["fen"] == board.fen()
            assert step["explanation"]


def test_opening_catalog_rejects_duplicates_and_illegal_moves(tmp_path, monkeypatch):
    path = tmp_path / "catalog.json"
    monkeypatch.setattr(opening_service, "OPENING_CATALOG_PATH", path)
    guide = {
        "id": "test", "title": "Test", "line": "Main", "introduction": "Start",
        "ideas": ["Develop"], "moves": [{"move_uci": "e2e4", "explanation": "White moves"}],
    }
    path.write_text(json.dumps([guide, guide]))
    with pytest.raises(ValueError, match="Duplicate opening ID"):
        opening_service.load_opening_catalog()
    guide["moves"][0]["move_uci"] = "e2e5"
    path.write_text(json.dumps([guide]))
    with pytest.raises(ValueError, match="Invalid opening move"):
        opening_service.load_opening_catalog()
