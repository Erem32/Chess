"""PostgreSQL-only transaction tests; set TEST_POSTGRES_URL to a disposable test DB."""

import os
from concurrent.futures import ThreadPoolExecutor
from queue import Queue
from time import monotonic, sleep
from uuid import uuid4

import chess
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.models import Game, GamePlayer, User
from app.repositories import game_repository
from app.services.chess_service import GameNotActiveError, NotPlayerTurnError, apply_player_move, claim_draw, respond_to_draw_offer
from app.services.game_service import GameAlreadyFinishedError, GameCannotBeAbortedError, GameService


@pytest.fixture()
def pg_sessions():
    url = os.getenv("TEST_POSTGRES_URL")
    if not url:
        pytest.skip("set TEST_POSTGRES_URL to a disposable chess_test_* PostgreSQL database")
    parsed = make_url(url)
    if parsed.get_backend_name() != "postgresql" or not (parsed.database or "").startswith("chess_test_"):
        pytest.fail("TEST_POSTGRES_URL must target a disposable chess_test_* PostgreSQL database")
    schema = f"test_{uuid4().hex}"
    engine = create_engine(url)
    with engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    scoped = engine.execution_options(schema_translate_map={None: schema})
    try:
        Base.metadata.create_all(scoped)
        yield sessionmaker(bind=scoped, expire_on_commit=False)
    finally:
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        engine.dispose()


def _setup_game(factory, fen=chess.STARTING_FEN, turn="white", offer=False):
    with factory() as db:
        white = User(username="white", email="white@example.com", hashed_password="x")
        black = User(username="black", email="black@example.com", hashed_password="x")
        db.add_all([white, black])
        db.flush()
        game = Game(status="active", current_fen=fen, turn_color=turn,
                    draw_offer_by_user_id=white.id if offer else None)
        db.add(game)
        db.flush()
        db.add_all([GamePlayer(game_id=game.id, user_id=white.id, color="white"),
                    GamePlayer(game_id=game.id, user_id=black.id, color="black")])
        db.commit()
        return game.id, white.id, black.id


def _run_while_locked(factory, game_id, user_id, blocked_action, first_action):
    pids = Queue()

    def worker():
        with factory() as db:
            # Exercise a stale identity-map entry as well as concurrent locking.
            game = db.get(Game, game_id)
            user = db.get(User, user_id)
            assert game.status == "active"
            pids.put(db.execute(text("SELECT pg_backend_pid()")).scalar_one())
            return blocked_action(db, user)

    with factory() as first, ThreadPoolExecutor(max_workers=1) as pool:
        game_repository.get_game_for_update(first, game_id)
        future = pool.submit(worker)
        try:
            pid = pids.get(timeout=5)
            deadline = monotonic() + 5
            with factory() as observer:
                while monotonic() < deadline:
                    blocked = observer.execute(
                        text("SELECT cardinality(pg_blocking_pids(:pid)) > 0"), {"pid": pid}
                    ).scalar_one()
                    if blocked:
                        break
                    if future.done():
                        pytest.fail("competing action completed without waiting for the game lock")
                    sleep(0.02)
                else:
                    pytest.fail("competing action did not attempt the row lock")
            first_action(first)
            # Each tested service commits its transaction and releases the lock.
            return future.result(timeout=5)
        finally:
            first.rollback()


def test_checkmate_wins_over_waiting_resignation(pg_sessions):
    board = chess.Board()
    for move in ("f2f3", "e7e5", "g2g4"):
        board.push_uci(move)
    game_id, white_id, black_id = _setup_game(pg_sessions, board.fen(), "black")

    def resign(db, user):
        with pytest.raises(GameAlreadyFinishedError):
            GameService().resign(db, game_id, user)

    _run_while_locked(pg_sessions, game_id, white_id, resign,
                      lambda db: apply_player_move(db, game_id, black_id, "d8h4"))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.status == "black_win"
        assert game.result == "0-1"
        assert {p.color: p.result for p in game.players} == {"white": "loss", "black": "win"}


def test_accepted_draw_wins_over_waiting_resignation(pg_sessions):
    game_id, white_id, black_id = _setup_game(pg_sessions, offer=True)

    def resign(db, user):
        with pytest.raises(GameAlreadyFinishedError):
            GameService().resign(db, game_id, user)

    _run_while_locked(pg_sessions, game_id, white_id, resign,
                      lambda db: respond_to_draw_offer(db, game_id, black_id, accept=True))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.status == "draw"
        assert game.result == "draw_agreed"
        assert {p.result for p in game.players} == {"draw"}


def test_abort_wins_over_waiting_move(pg_sessions):
    game_id, white_id, _ = _setup_game(pg_sessions)

    def move(db, user):
        with pytest.raises(GameNotActiveError):
            apply_player_move(db, game_id, user.id, "e2e4")

    _run_while_locked(pg_sessions, game_id, white_id, move,
                      lambda db: GameService().abort_active_games_for_user(db, db.get(User, white_id)))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.status == "aborted"
        assert game.current_fen == chess.STARTING_FEN
        assert not game.moves


def test_first_move_prevents_waiting_abort(pg_sessions):
    game_id, white_id, _ = _setup_game(pg_sessions)

    def abort(db, user):
        with pytest.raises(GameCannotBeAbortedError):
            GameService().abort_active_games_for_user(db, user)

    _run_while_locked(pg_sessions, game_id, white_id, abort,
                      lambda db: apply_player_move(db, game_id, white_id, "e2e4"))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.status == "active"
        assert len(game.moves) == 1


def test_checkmate_wins_over_waiting_abort(pg_sessions):
    board = chess.Board()
    for move in ("f2f3", "e7e5", "g2g4"):
        board.push_uci(move)
    game_id, white_id, black_id = _setup_game(pg_sessions, board.fen(), "black")

    result = _run_while_locked(
        pg_sessions, game_id, white_id,
        lambda db, user: GameService().abort_active_games_for_user(db, user),
        lambda db: apply_player_move(db, game_id, black_id, "d8h4"),
    )
    assert result == []
    with pg_sessions() as db:
        assert db.get(Game, game_id).status == "black_win"


def test_claim_wins_over_waiting_move(pg_sessions):
    fen = "8/8/8/8/8/8/R6r/K6k w - - 100 51"
    game_id, white_id, _ = _setup_game(pg_sessions, fen)

    def move(db, user):
        with pytest.raises(GameNotActiveError):
            apply_player_move(db, game_id, user.id, "a2a3")

    _run_while_locked(pg_sessions, game_id, white_id, move,
                      lambda db: claim_draw(db, game_id, white_id))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.result == "draw_claimed_fifty_move"
        assert not game.moves


def test_move_invalidates_waiting_claim_from_previous_turn(pg_sessions):
    fen = "8/8/8/8/8/8/R6r/K6k w - - 100 51"
    game_id, white_id, _ = _setup_game(pg_sessions, fen)

    def claim(db, user):
        with pytest.raises(NotPlayerTurnError):
            claim_draw(db, game_id, user.id)

    _run_while_locked(pg_sessions, game_id, white_id, claim,
                      lambda db: apply_player_move(db, game_id, white_id, "a2a3"))
    with pg_sessions() as db:
        game = db.get(Game, game_id)
        assert game.status == "active"
        assert len(game.moves) == 1
