from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app import main
from app.main import app
from app.models import ChatMessage, Game, MatchmakingQueue
from app.models import chat_message, game, game_player, matchmaking, move, user  # noqa: F401
from app.services.chess_service import apply_player_move


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


@pytest.fixture()
def client(db_session_factory: sessionmaker[Session]) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


def _auth_headers(client: TestClient, username: str) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": f"{username}@example.com", "password": "secret"},
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": username, "password": "secret"},
    )
    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}


def test_matchmaking_creates_game_for_second_player(
    client: TestClient, db_session_factory: sessionmaker[Session]
) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")

    waiting_response = client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)

    assert waiting_response.status_code == 200
    assert waiting_response.json() == {"status": "waiting", "game_id": None, "game": None}
    assert matched_response.status_code == 200
    data = matched_response.json()
    assert data["status"] == "matched"
    assert data["game_id"] == data["game"]["id"]
    assert data["game"]["status"] == "active"
    assert data["game"]["turn_color"] == "white"
    assert {player["color"] for player in data["game"]["players"]} == {"white", "black"}
    assert {player["username"] for player in data["game"]["players"]} == {"alice", "bob"}
    with db_session_factory() as db:
        assert db.query(Game).filter(Game.status == "active").count() == 1
        assert db.query(MatchmakingQueue).count() == 0


def test_waiting_player_can_poll_matchmaking_status_for_game(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")

    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)
    status_response = client.get("/api/v1/matchmaking/status", headers=alice_headers)

    assert status_response.status_code == 200
    assert status_response.json()["status"] == "matched"
    assert status_response.json()["game_id"] == matched_response.json()["game_id"]
    assert status_response.json()["game"]["id"] == matched_response.json()["game"]["id"]


def test_queued_player_status_returns_waiting(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")

    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    status_response = client.get("/api/v1/matchmaking/status", headers=alice_headers)

    assert status_response.status_code == 200
    assert status_response.json() == {"status": "waiting", "game_id": None, "game": None}


def test_leave_matchmaking_is_idempotent(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")

    assert client.post("/api/v1/matchmaking/join", headers=alice_headers).status_code == 200
    assert client.post("/api/v1/matchmaking/leave", headers=alice_headers).status_code == 204
    assert client.post("/api/v1/matchmaking/leave", headers=alice_headers).status_code == 204


def test_game_reads_history_moves_and_resign(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)
    game_id = matched_response.json()["game"]["id"]

    game_response = client.get(f"/api/v1/games/{game_id}", headers=alice_headers)
    moves_response = client.get(f"/api/v1/games/{game_id}/moves", headers=alice_headers)
    history_response = client.get("/api/v1/games/my-history", headers=alice_headers)
    resign_response = client.post(f"/api/v1/games/{game_id}/resign", headers=bob_headers)

    assert game_response.status_code == 200
    assert game_response.json()["id"] == game_id
    assert moves_response.status_code == 200
    assert moves_response.json() == {"game_id": game_id, "moves": []}
    assert history_response.status_code == 200
    assert [game["id"] for game in history_response.json()["games"]] == [game_id]
    assert resign_response.status_code == 200
    assert resign_response.json()["status"] == "resigned"
    assert resign_response.json()["result"] == "white_wins_by_resignation"


def test_user_can_abort_active_games_for_clean_dashboard(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)
    game_id = matched_response.json()["game"]["id"]

    active_response = client.get("/api/v1/games/my-active", headers=alice_headers)
    abort_response = client.post("/api/v1/games/my-active/abort", headers=alice_headers)
    next_active_response = client.get("/api/v1/games/my-active", headers=alice_headers)

    assert active_response.status_code == 200
    assert active_response.json()["id"] == game_id
    assert abort_response.status_code == 200
    assert abort_response.json()["games"][0]["status"] == "aborted"
    assert all(player["result"] is None for player in abort_response.json()["games"][0]["players"])
    assert client.get("/api/v1/users/me/stats", headers=alice_headers).json()["games_played"] == 0
    assert next_active_response.status_code == 200
    assert next_active_response.json() is None


def test_cannot_abort_after_first_move(client: TestClient, db_session_factory: sessionmaker[Session]) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    game = client.post("/api/v1/matchmaking/join", headers=bob_headers).json()["game"]
    white = next(player for player in game["players"] if player["color"] == "white")
    with db_session_factory() as db:
        apply_player_move(db, game["id"], white["user_id"], "e2e4")

    response = client.post("/api/v1/games/my-active/abort", headers=alice_headers)
    assert response.status_code == 409
    assert "resign" in response.json()["detail"]
    assert client.get("/api/v1/games/my-active", headers=alice_headers).json()["status"] == "active"


def test_chat_history_is_authorized_bounded_and_paginated(client: TestClient, db_session_factory: sessionmaker[Session]) -> None:
    alice = _auth_headers(client, "alice")
    bob = _auth_headers(client, "bob")
    eve = _auth_headers(client, "eve")
    client.post("/api/v1/matchmaking/join", headers=alice)
    game = client.post("/api/v1/matchmaking/join", headers=bob).json()["game"]
    game_id = game["id"]
    sender = game["players"][0]["user_id"]
    with db_session_factory() as db:
        db.add_all([ChatMessage(game_id=game_id, user_id=sender, message=f"message {i}") for i in range(105)])
        db.commit()

    assert client.get(f"/api/v1/games/{game_id}/chat").status_code == 401
    assert client.get(f"/api/v1/games/{game_id}/chat", headers=eve).status_code == 403
    assert client.get("/api/v1/games/999999/chat", headers=alice).status_code == 404
    assert client.get(f"/api/v1/games/{game_id}/chat?limit=101", headers=alice).status_code == 422
    assert client.get(f"/api/v1/games/{game_id}/chat?limit=0", headers=alice).status_code == 422
    assert client.get(f"/api/v1/games/{game_id}/chat?before_id=0", headers=alice).status_code == 422
    latest = client.get(f"/api/v1/games/{game_id}/chat", headers=alice).json()["messages"]
    assert len(latest) == 100
    assert latest[0]["message"] == "message 5"
    assert latest[-1]["message"] == "message 104"
    older = client.get(f"/api/v1/games/{game_id}/chat?before_id={latest[0]['id']}&limit=10", headers=bob).json()["messages"]
    assert [item["message"] for item in older] == [f"message {i}" for i in range(5)]


def test_chat_socket_acknowledges_success_and_rejection(client: TestClient, db_session_factory, monkeypatch):
    alice = _auth_headers(client, "alice")
    bob = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice)
    game_id = client.post("/api/v1/matchmaking/join", headers=bob).json()["game"]["id"]
    monkeypatch.setattr(main, "SessionLocal", db_session_factory)
    token = alice["Authorization"].split(" ", 1)[1]
    with client.websocket_connect(f"/ws/games/{game_id}?token={token}") as socket:
        assert socket.receive_json()["type"] == "game_state"
        socket.send_json({"type": "chat", "payload": {"message": "hello", "client_message_id": "test-1"}})
        event = socket.receive_json()
        assert event["type"] == "chat"
        assert event["payload"]["client_message_id"] == "test-1"
        assert event["payload"]["message"] == "hello"
        socket.send_json({"type": "chat", "payload": {"message": " ", "client_message_id": "test-2"}})
        rejection = socket.receive_json()
        assert rejection["type"] == "error"
        assert rejection["payload"]["client_message_id"] == "test-2"
        socket.send_json({"type": "chat", "payload": {"message": "hello", "client_message_id": "x" * 65}})
        assert socket.receive_json()["type"] == "error"
        socket.send_json({"type": "chat", "payload": {"message": "legacy"}})
        assert socket.receive_json()["payload"]["message"] == "legacy"
    with db_session_factory() as db:
        assert db.query(ChatMessage).count() == 2


def test_player_can_offer_draw_and_opponent_can_accept(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)
    game_id = matched_response.json()["game"]["id"]

    offer_response = client.post(f"/api/v1/games/{game_id}/draw-offer", headers=alice_headers)
    accept_response = client.post(f"/api/v1/games/{game_id}/draw-offer/accept", headers=bob_headers)

    assert offer_response.status_code == 200
    assert offer_response.json()["draw_offer_by_user_id"] is not None
    assert accept_response.status_code == 200
    assert accept_response.json()["status"] == "draw"
    assert accept_response.json()["result"] == "draw_agreed"
    assert accept_response.json()["draw_offer_by_user_id"] is None


def test_player_can_decline_draw_offer(client: TestClient) -> None:
    alice_headers = _auth_headers(client, "alice")
    bob_headers = _auth_headers(client, "bob")
    client.post("/api/v1/matchmaking/join", headers=alice_headers)
    matched_response = client.post("/api/v1/matchmaking/join", headers=bob_headers)
    game_id = matched_response.json()["game"]["id"]

    client.post(f"/api/v1/games/{game_id}/draw-offer", headers=alice_headers)
    decline_response = client.post(f"/api/v1/games/{game_id}/draw-offer/decline", headers=bob_headers)
    game_response = client.get(f"/api/v1/games/{game_id}", headers=alice_headers)

    assert decline_response.status_code == 200
    assert decline_response.json()["status"] == "active"
    assert decline_response.json()["draw_offer_by_user_id"] is None
    assert game_response.status_code == 200
    assert game_response.json()["status"] == "active"
    assert game_response.json()["draw_offer_by_user_id"] is None
