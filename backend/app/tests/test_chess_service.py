from collections.abc import Generator

import chess
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models import ChatMessage, Game, GamePlayer, Move, User
from app.services.chess_service import (
    IllegalMoveError,
    ChatMessageError,
    NotPlayerTurnError,
    apply_player_move,
    apply_uci_move,
    persist_chat_message,
)


@pytest.fixture()
def db_session_factory() -> Generator[sessionmaker[Session], None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    try:
        yield TestingSessionLocal
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


def test_legal_move_is_accepted() -> None:
    result = apply_uci_move(chess.STARTING_FEN, "e2e4")

    assert result["turn_color"] == "black"
    assert result["san"] == "e4"


def test_illegal_move_is_rejected() -> None:
    with pytest.raises(IllegalMoveError):
        apply_uci_move(chess.STARTING_FEN, "e2e5")


def test_checkmate_detection() -> None:
    board = chess.Board()
    for move in ["f2f3", "e7e5", "g2g4"]:
        board.push(chess.Move.from_uci(move))

    result = apply_uci_move(board.fen(), "d8h4")

    assert result["is_checkmate"] is True


def test_checkmate_takes_precedence_over_seventyfive_move_draw() -> None:
    board = chess.Board()
    for move in ["f2f3", "e7e5", "g2g4"]:
        board.push_uci(move)
    board.halfmove_clock = 149
    result = apply_uci_move(board.fen(), "d8h4")
    assert result["is_checkmate"] is True
    assert result["result"] == "0-1"


def test_seventyfive_move_rule_ends_game_as_draw(db_session_factory: sessionmaker[Session]) -> None:
    with db_session_factory() as db:
        game_id, white_user_id, _ = _create_active_game(db)
        game = db.get(Game, game_id)
        game.current_fen = "8/8/8/8/8/8/R6r/K6k w - - 149 76"
        db.commit()

        result = apply_player_move(db, game_id, white_user_id, "a2a3")

        assert result["is_seventyfive_moves"] is True
        assert result["game"]["status"] == "draw"
        assert result["game"]["result"] == "1/2-1/2"
        assert {player.result for player in db.get(Game, game_id).players} == {"draw"}


def test_apply_player_move_persists_move_and_updates_game(
    db_session_factory: sessionmaker[Session],
) -> None:
    with db_session_factory() as db:
        game_id, white_user_id, _ = _create_active_game(db)

        result = apply_player_move(db, game_id, white_user_id, "e2e4")

        move = db.query(Move).filter(Move.game_id == game_id).one()
        game = db.get(Game, game_id)
        assert game is not None
        assert move.move_number == 1
        assert move.move_san == "e4"
        assert game.current_fen == move.fen_after_move
        assert game.turn_color == "black"
        assert result["game"]["turn_color"] == "black"
        assert result["move"]["move_uci"] == "e2e4"


def test_apply_player_move_rejects_wrong_turn(
    db_session_factory: sessionmaker[Session],
) -> None:
    with db_session_factory() as db:
        game_id, _, black_user_id = _create_active_game(db)

        with pytest.raises(NotPlayerTurnError):
            apply_player_move(db, game_id, black_user_id, "e7e5")

        assert db.query(Move).filter(Move.game_id == game_id).count() == 0


def test_persist_chat_message_strips_and_stores_message(
    db_session_factory: sessionmaker[Session],
) -> None:
    with db_session_factory() as db:
        game_id, white_user_id, _ = _create_active_game(db)

        payload = persist_chat_message(db, game_id, white_user_id, " hello ")

        chat_message = db.get(ChatMessage, payload["id"])
        assert chat_message is not None
        assert chat_message.message == "hello"
        assert payload["message"] == "hello"
        assert payload["game_id"] == game_id


@pytest.mark.parametrize("text", [" ", "x" * 1001, "bad\x00message", "bad\ud800message"])
def test_chat_rejects_empty_oversized_or_invalid_messages(db_session_factory, text):
    with db_session_factory() as db:
        game_id, user_id, _ = _create_active_game(db)
        with pytest.raises(ChatMessageError):
            persist_chat_message(db, game_id, user_id, text)
        assert db.query(ChatMessage).count() == 0


def test_chat_accepts_exact_maximum_unicode_length(db_session_factory):
    with db_session_factory() as db:
        game_id, user_id, _ = _create_active_game(db)
        assert persist_chat_message(db, game_id, user_id, "😀" * 1000)["message"] == "😀" * 1000


def _create_active_game(db: Session) -> tuple[int, int, int]:
    white = User(username="white", email="white@example.com", hashed_password="hashed")
    black = User(username="black", email="black@example.com", hashed_password="hashed")
    db.add_all([white, black])
    db.flush()

    game = Game(status="active", current_fen=chess.STARTING_FEN, turn_color="white")
    db.add(game)
    db.flush()
    db.add_all(
        [
            GamePlayer(game_id=game.id, user_id=white.id, color="white"),
            GamePlayer(game_id=game.id, user_id=black.id, color="black"),
        ]
    )
    db.commit()
    return game.id, white.id, black.id
