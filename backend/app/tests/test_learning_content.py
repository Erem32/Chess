import chess
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.models import User
from app.services.opening_service import load_opening_guide
from app.services.practice_service import load_exercises


def test_authored_practice_content_and_attempts():
    exercises = load_exercises()
    lessons = [item for item in exercises if item.kind == "lesson"]
    puzzles = [item for item in exercises if item.kind == "puzzle"]
    assert len(lessons) == 24
    assert [item.id for item in lessons[:6]] == ["lesson-pawn", "lesson-knight", "lesson-bishop", "lesson-rook", "lesson-queen", "lesson-king"]
    assert {item.category for item in lessons} == {"Piece movement", "Special moves", "King safety", "Basic tactics"}
    assert all(item.title for item in lessons)
    assert len(puzzles) == 103
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="learner", email="learner@example.com", hashed_password="x")
    try:
        with TestClient(app) as client:
            for exercise in exercises:
                board = chess.Board(exercise.fen)
                accepted = set(exercise.accepted_moves)
                incorrect = next(move for move in board.legal_moves if move.uci() not in accepted)
                response = client.post(f"/api/v1/practice/exercises/{exercise.id}/attempt", json={"move_uci": incorrect.uci()})
                assert response.json()["result"] == "incorrect"
                assert response.json()["fen"] == exercise.fen
                for move in accepted:
                    response = client.post(f"/api/v1/practice/exercises/{exercise.id}/attempt", json={"move_uci": move})
                    assert response.json()["result"] == "correct"
                    expected = chess.Board(exercise.fen)
                    expected.push_uci(move)
                    assert response.json()["fen"] == expected.fen()
                assert client.post(f"/api/v1/practice/exercises/{exercise.id}/attempt", json={"move_uci": "a1a1"}).json()["result"] == "illegal"
            for puzzle in puzzles:
                solution = client.get(f"/api/v1/practice/exercises/{puzzle.id}/solution").json()
                assert solution["move_uci"] in puzzle.accepted_moves
                if puzzle.solution_moves is None:
                    assert solution["explanation"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_mate_puzzle_accepts_all_checkmates_and_only_checkmates():
    puzzle = next(item for item in load_exercises() if item.id == "puzzle-mate-one")
    board = chess.Board(puzzle.fen)
    mates = set()
    for move in list(board.legal_moves):
        board.push(move)
        if board.is_checkmate():
            mates.add(move.uci())
        board.pop()
    assert mates and mates == set(puzzle.accepted_moves)


def test_special_rule_lessons_demonstrate_the_rules_they_name():
    lessons = {item.id: item for item in load_exercises() if item.kind == "lesson"}
    for lesson_id in ("lesson-castle-kingside", "lesson-castle-queenside"):
        lesson = lessons[lesson_id]
        board = chess.Board(lesson.fen)
        assert board.is_castling(chess.Move.from_uci(lesson.accepted_moves[0]))
    lesson = lessons["lesson-en-passant"]
    board = chess.Board(lesson.fen)
    assert board.is_en_passant(chess.Move.from_uci(lesson.accepted_moves[0]))
    assert chess.Move.from_uci(lessons["lesson-underpromotion"].accepted_moves[0]).promotion == chess.KNIGHT

    lesson = lessons["lesson-checkmate"]
    board = chess.Board(lesson.fen)
    mates = set()
    for move in list(board.legal_moves):
        board.push(move)
        if board.is_checkmate():
            mates.add(move.uci())
        board.pop()
    assert set(lesson.accepted_moves) == mates


def test_authored_opening_sequence():
    guide = load_opening_guide()
    assert guide["title"].startswith("Italian Game")
    assert [step["move"] for step in guide["steps"]] == [None, "e4", "e5", "Nf3", "Nc6", "Bc4"]
    board = chess.Board()
    for step in guide["steps"][1:]:
        board.push_san(step["move"])
        assert step["fen"] == board.fen()
        assert step["explanation"]
