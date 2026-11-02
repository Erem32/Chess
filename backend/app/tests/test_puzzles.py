import json

import chess
import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.models import User
from app.services import practice_service
from app.services.puzzle_service import attempt, hint


@pytest.fixture()
def client(tmp_path, monkeypatch):
    path = tmp_path / "puzzles.json"
    path.write_text(json.dumps([
        {"id": "line", "kind": "puzzle", "fen": chess.STARTING_FEN, "instruction": "Find the line",
         "accepted_moves": ["e2e4"], "solution_moves": ["e2e4", "e7e5", "g1f3"]},
        {"id": "mate", "kind": "puzzle", "fen": "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
         "instruction": "Mate", "accepted_moves": ["f7f8"], "solution_moves": ["f7f8"]},
        {"id": "lesson", "fen": chess.STARTING_FEN, "instruction": "Lesson", "accepted_moves": ["e2e4"]},
    ]))
    monkeypatch.setattr(practice_service, "PRACTICE_CONTENT_PATH", path)
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def post(client, exercise_id, action, moves=None, **kwargs):
    return client.post(f"/api/v1/practice/puzzles/{exercise_id}/{action}", json={"moves": moves or [], **kwargs})


def test_multimove_line_hints_and_reveal(client):
    assert post(client, "line", "hint").json() == {"square": "e2", "piece": "pawn"}
    assert post(client, "line", "attempt", move_uci="e2e5").json()["result"] == "illegal"
    incorrect = post(client, "line", "attempt", move_uci="d2d4").json()
    assert incorrect["result"] == "incorrect" and incorrect["fen"] == chess.STARTING_FEN
    first = post(client, "line", "attempt", move_uci="e2e4").json()
    board = chess.Board()
    board.push_uci("e2e4")
    board.push_uci("e7e5")
    assert first["result"] == "correct" and not first["complete"]
    assert first["opponent_move"] == "e5" and first["fen"] == board.fen()
    assert post(client, "line", "hint", ["e2e4"]).json() == {"square": "g1", "piece": "knight"}
    assert post(client, "line", "solution", ["e2e4"]).json()["moves"] == ["Nf3"]
    assert post(client, "line", "solution").json()["moves"] == ["e4", "e5", "Nf3"]
    last = post(client, "line", "attempt", ["e2e4"], move_uci="g1f3").json()
    board.push_uci("g1f3")
    assert last["result"] == "correct" and last["complete"] and last["fen"] == board.fen()


def test_progress_is_validated_and_only_puzzles_accept_actions(client):
    for action in ("attempt", "hint", "solution"):
        extra = {"move_uci": "g1f3"} if action == "attempt" else {}
        assert post(client, "line", action, ["d2d4"], **extra).status_code == 400
        assert post(client, "line", action, ["e2e4", "g1f3"], **extra).status_code == 400
        assert post(client, "lesson", action, **extra).status_code == 404
        assert post(client, "missing", action, **extra).status_code == 404
    assert client.post("/api/v1/practice/puzzles/line/attempt", json={"moves": [], "move_uci": "e2e4", "fen": chess.STARTING_FEN}).status_code == 422


def test_alternative_checkmate_is_accepted(client):
    response = post(client, "mate", "attempt", move_uci="f7e8").json()
    assert response["result"] == "correct" and response["complete"]
    assert chess.Board(response["fen"]).is_checkmate()


def test_puzzle_endpoints_require_authentication():
    with TestClient(app) as client:
        for action in ("attempt", "hint", "solution"):
            body = {"moves": [], "move_uci": "e2e4"} if action == "attempt" else {"moves": []}
            assert client.post(f"/api/v1/practice/puzzles/line/{action}", json=body).status_code == 401


def test_every_imported_line_plays_to_completion():
    puzzles = [item for item in practice_service.load_exercises() if item.solution_moves]
    assert len(puzzles) == 100
    for puzzle in puzzles:
        moves = []
        line = puzzle.solution_moves
        assert line is not None
        for index in range(0, len(line), 2):
            assert hint(puzzle, moves).square == line[index][:2]
            response = attempt(puzzle, moves, line[index])
            assert response.result == "correct", puzzle.id
            assert response.complete == (index == len(line) - 1), puzzle.id
            if not response.complete:
                moves.append(line[index])


@pytest.mark.parametrize("line", [[], ["d2d4"], ["e2e4", "e7e5"], ["e2e4", "e7e5", "g1g4"]])
def test_catalog_rejects_invalid_puzzle_lines(line):
    with pytest.raises(ValueError):
        practice_service.PracticeExercise(
            id="invalid-line", kind="puzzle", fen=chess.STARTING_FEN,
            instruction="Find the line", accepted_moves=["e2e4"], solution_moves=line,
        )
