"""End-to-end socket protocol checks using an isolated in-memory database."""

from contextlib import contextmanager
from threading import Event

import chess
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.websockets import WebSocketDisconnect

from app import main
from app.api import websocket as websocket_api
from app.core.security import create_access_token
from app.db.session import Base
from app.models import Game, GamePlayer, Move, User
from app.schemas.game import GameRead
from app.schemas.move import MoveRead
from app.services.websocket_manager import WebSocketManager


@pytest.fixture()
def game_client(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    sessions = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(engine)
    with sessions() as db:
        white = User(username="white", email="white@example.com", hashed_password="test")
        black = User(username="black", email="black@example.com", hashed_password="test")
        outsider = User(username="outsider", email="outsider@example.com", hashed_password="test")
        db.add_all([white, black, outsider])
        db.flush()
        game = Game(status="active", current_fen=chess.STARTING_FEN, turn_color="white")
        db.add(game)
        db.flush()
        db.add_all([
            GamePlayer(game_id=game.id, user_id=white.id, color="white"),
            GamePlayer(game_id=game.id, user_id=black.id, color="black"),
        ])
        db.commit()
        game_id = game.id
        tokens = {color: create_access_token(str(user.id)) for color, user in
                  (("white", white), ("black", black), ("outsider", outsider))}

    monkeypatch.setattr(websocket_api, "SessionLocal", sessions)
    monkeypatch.setattr(websocket_api, "websocket_manager", WebSocketManager())
    try:
        with TestClient(main.app) as client:
            yield client, sessions, game_id, tokens
    finally:
        engine.dispose()


def socket_url(game_id, token):
    return f"/ws/games/{game_id}?token={token}"


def test_socket_rejects_missing_invalid_and_nonplayer_tokens(game_client):
    client, _, game_id, tokens = game_client
    for url in (f"/ws/games/{game_id}", socket_url(game_id, "invalid-token"),
                socket_url(game_id, tokens["outsider"])):
        with client.websocket_connect(url) as ws:
            assert ws.receive_json()["type"] == "error"
            with pytest.raises(WebSocketDisconnect) as exc:
                ws.receive_json()
            assert exc.value.code == 1008


def test_move_is_broadcast_to_both_players_and_persisted(game_client):
    client, sessions, game_id, tokens = game_client
    with client.websocket_connect(socket_url(game_id, tokens["white"])) as white:
        with client.websocket_connect(socket_url(game_id, tokens["black"])) as black:
            assert white.receive_json()["payload"]["game"]["current_fen"] == chess.STARTING_FEN
            assert black.receive_json()["payload"]["game"]["current_fen"] == chess.STARTING_FEN
            black.send_json({"type": "move", "payload": {"move_uci": "e7e5"}})
            assert black.receive_json()["type"] == "error"
            white.send_json({"type": "move", "payload": {"move_uci": "e2e4"}})
            white_update = white.receive_json()
            black_update = black.receive_json()
            assert white_update == black_update
            assert white_update["type"] == "game_state"
            assert white_update["payload"]["move"]["move_uci"] == "e2e4"
            assert white_update["payload"]["game"]["turn_color"] == "black"
            with sessions() as db:
                assert db.query(Move).filter_by(game_id=game_id).one().move_uci == "e2e4"
                assert db.get(Game, game_id).current_fen == white_update["payload"]["game"]["current_fen"]

    with client.websocket_connect(socket_url(game_id, tokens["black"])) as reconnected:
        state = reconnected.receive_json()["payload"]["game"]
        assert state["current_fen"] == white_update["payload"]["game"]["current_fen"]
        assert state["turn_color"] == "black"


def test_socket_game_state_contract_and_legacy_move_inputs(game_client):
    client, _, game_id, tokens = game_client
    with client.websocket_connect(socket_url(game_id, tokens["white"])) as white:
        with client.websocket_connect(socket_url(game_id, tokens["black"])) as black:
            for socket in (white, black):
                initial = socket.receive_json()
                assert initial["type"] == "game_state"
                assert set(initial["payload"]) == {"game"}
                assert GameRead.model_validate(initial["payload"]["game"]).id == game_id

            for number, socket, message in (
                (1, white, {"type": "move", "move": "e2e4"}),
                (2, black, {"type": "move", "payload": {"move": "e7e5"}}),
                (3, white, {"type": "move", "payload": {"move_uci": "g1f3"}}),
            ):
                socket.send_json(message)
                event = white.receive_json()
                assert black.receive_json() == event
                assert event["type"] == "game_state"
                payload = event["payload"]
                game = GameRead.model_validate(payload["game"])
                move = MoveRead.model_validate(payload["move"])
                assert game.id == move.game_id == game_id
                assert move.move_number == number
                assert move.fen_after_move == game.current_fen
                assert all(isinstance(payload[key], bool) for key in (
                    "is_checkmate", "is_stalemate", "is_insufficient_material",
                    "is_seventyfive_moves", "is_fivefold_repetition",
                ))


def test_bad_messages_and_illegal_moves_do_not_end_connection(game_client):
    client, sessions, game_id, tokens = game_client
    with client.websocket_connect(socket_url(game_id, tokens["white"])) as ws:
        assert ws.receive_json()["type"] == "game_state"
        for message in ("not json", "[]", '{"type":"unknown"}',
                        '{"type":"move","payload":{"move_uci":"e2e5"}}'):
            ws.send_text(message)
            assert ws.receive_json()["type"] == "error"
        ws.send_json({"type": "move", "payload": {"move_uci": "e2e4"}})
        assert ws.receive_json()["payload"]["move"]["move_uci"] == "e2e4"
        with sessions() as db:
            assert db.query(Move).filter_by(game_id=game_id).count() == 1


def test_idle_socket_does_not_keep_database_session_open(game_client, monkeypatch):
    client, sessions, game_id, tokens = game_client
    closed = Event()
    opened = []

    @contextmanager
    def tracked_session():
        opened.append(True)
        with sessions() as db:
            yield db
        closed.set()

    monkeypatch.setattr(websocket_api, "SessionLocal", tracked_session)
    with client.websocket_connect(socket_url(game_id, tokens["white"])) as ws:
        assert ws.receive_json()["type"] == "game_state"
        assert closed.wait(2)
        assert len(opened) == 1
        closed.clear()
        ws.send_json({"type": "move", "payload": {"move_uci": "e2e4"}})
        assert ws.receive_json()["type"] == "game_state"
        assert closed.wait(2)
        assert len(opened) == 2
