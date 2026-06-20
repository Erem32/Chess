from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app
from app.models import Game, MatchmakingQueue
from app.models import chat_message, game, game_player, matchmaking, move, user  # noqa: F401


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
    assert next_active_response.status_code == 200
    assert next_active_response.json() is None
