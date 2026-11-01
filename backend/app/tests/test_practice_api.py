import json

import chess
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.db.session import Base, get_db
from app.main import app
from app.models import Game, GamePlayer, Move, User
from app.services import practice_service


@pytest.fixture()
def catalog(tmp_path, monkeypatch):
    path = tmp_path / "practice.json"
    path.write_text(json.dumps([
        {
            "id": "opening",
            "fen": chess.STARTING_FEN,
            "instruction": "Try a move.",
            "accepted_moves": ["e2e4"],
            "correct_feedback": "Correct.",
            "incorrect_feedback": "Try another move.",
        },
        {
            "id": "promotion",
            "fen": "7k/P7/8/8/8/8/8/7K w - - 0 1",
            "instruction": "Promote the pawn.",
            "accepted_moves": ["a7a8n"],
            "correct_feedback": "Knight promotion.",
            "incorrect_feedback": "Try another piece.",
        },
    ]))
    monkeypatch.setattr(practice_service, "PRACTICE_CONTENT_PATH", path)
    return path


@pytest.fixture()
def client(catalog):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_practice_endpoints_require_authentication():
    with TestClient(app) as test_client:
        assert test_client.get("/api/v1/practice/exercises").status_code == 401
        assert test_client.post("/api/v1/practice/exercises/unknown/attempt", json={"move_uci": "e2e4"}).status_code == 401


def test_empty_catalog_and_unknown_exercise(client, catalog):
    catalog.write_text("[]")
    assert client.get("/api/v1/practice/exercises").json() == []
    assert client.post("/api/v1/practice/exercises/missing/attempt", json={"move_uci": "e2e4"}).status_code == 404


def test_catalog_exposes_positions_without_answers(client):
    response = client.get("/api/v1/practice/exercises")
    assert response.status_code == 200
    assert response.json() == [
        {"id": "opening", "fen": chess.STARTING_FEN, "instruction": "Try a move."},
        {"id": "promotion", "fen": "7k/P7/8/8/8/8/8/7K w - - 0 1", "instruction": "Promote the pawn."},
    ]


@pytest.mark.parametrize("move", ["e2e5", "e7e5", "nope"])
def test_illegal_and_malformed_moves_keep_position(client, move):
    response = client.post("/api/v1/practice/exercises/opening/attempt", json={"move_uci": move})
    assert response.status_code == 200
    assert response.json()["result"] == "illegal"
    assert response.json()["fen"] == chess.STARTING_FEN


def test_legal_but_incorrect_move_keeps_position(client):
    response = client.post("/api/v1/practice/exercises/opening/attempt", json={"move_uci": "d2d4"})
    assert response.status_code == 200
    assert response.json() == {"result": "incorrect", "fen": chess.STARTING_FEN, "feedback": "Try another move."}


def test_correct_move_and_underpromotion_return_authoritative_positions(client):
    for exercise_id, start, move, feedback in (
        ("opening", chess.STARTING_FEN, "e2e4", "Correct."),
        ("promotion", "7k/P7/8/8/8/8/8/7K w - - 0 1", "a7a8n", "Knight promotion."),
    ):
        board = chess.Board(start)
        board.push_uci(move)
        response = client.post(f"/api/v1/practice/exercises/{exercise_id}/attempt", json={"move_uci": move})
        assert response.status_code == 200
        assert response.json() == {"result": "correct", "fen": board.fen(), "feedback": feedback}


def test_practice_does_not_change_online_games_or_moves(client):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    sessions = sessionmaker(bind=engine)
    with sessions() as db:
        db.add(User(id=1, username="learner", email="learner@example.com", hashed_password="x"))
        game = Game(status="active", current_fen=chess.STARTING_FEN, turn_color="white")
        db.add(game)
        db.flush()
        db.add(GamePlayer(game_id=game.id, user_id=1, color="white"))
        db.commit()
        game_id = game.id

    def isolated_db():
        with sessions() as db:
            yield db

    app.dependency_overrides[get_db] = isolated_db
    try:
        assert client.post("/api/v1/practice/exercises/opening/attempt", json={"move_uci": "e2e4"}).status_code == 200
        with sessions() as db:
            assert db.get(Game, game_id).current_fen == chess.STARTING_FEN
            assert db.query(Move).count() == 0
            assert db.query(Game).count() == 1
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


@pytest.mark.parametrize("overrides", [
    {"fen": "not a FEN"},
    {"fen": "8/8/8/8/8/8/8/8 w - - 0 1"},
    {"accepted_moves": ["not-uci"]},
    {"accepted_moves": ["e2e5"]},
    {"accepted_moves": ["e2e4", "e2e4"]},
])
def test_catalog_rejects_invalid_authored_positions_and_solutions(catalog, overrides):
    exercises = json.loads(catalog.read_text())
    exercises[0].update(overrides)
    catalog.write_text(json.dumps(exercises))
    with pytest.raises(ValueError):
        practice_service.load_exercises()


def test_catalog_rejects_duplicate_exercise_ids(catalog):
    exercises = json.loads(catalog.read_text())
    exercises[1]["id"] = exercises[0]["id"]
    catalog.write_text(json.dumps(exercises))
    with pytest.raises(ValueError):
        practice_service.load_exercises()


def test_attempt_rejects_client_supplied_answer_or_position(client):
    response = client.post(
        "/api/v1/practice/exercises/opening/attempt",
        json={"move_uci": "d2d4", "accepted_moves": ["d2d4"], "fen": chess.STARTING_FEN},
    )
    assert response.status_code == 422
