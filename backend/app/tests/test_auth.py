from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.session import Base, get_db
from app.main import app
from app.models import Game, GamePlayer
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


def test_password_hashing_works() -> None:
    hashed = hash_password("secret")

    assert hashed != "secret"
    assert verify_password("secret", hashed)
    assert not verify_password("wrong", hashed)


def test_jwt_creation_and_validation_works() -> None:
    token = create_access_token("123")
    payload = decode_access_token(token)

    assert payload["sub"] == "123"


def test_register_creates_user(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"
    assert "hashed_password" not in data


def test_register_rejects_duplicate_email_or_username(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )
    assert response.status_code == 201

    duplicate_email = client.post(
        "/api/v1/auth/register",
        json={"username": "alice2", "email": "alice@example.com", "password": "secret"},
    )
    duplicate_username = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice2@example.com", "password": "secret"},
    )

    assert duplicate_email.status_code == 409
    assert duplicate_username.status_code == 409


@pytest.mark.parametrize(
    "username,password",
    [("", "secret"), ("   ", "secret"), ("bad\x00name", "secret"), ("x" * 51, "secret"),
     ("alice", ""), ("alice", "x" * 73), ("alice", "ą" * 37), ("alice", "bad\x00password")],
)
def test_register_rejects_invalid_username_or_password(client: TestClient, username: str, password: str) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": "alice@example.com", "password": password},
    )
    assert response.status_code == 422


def test_register_accepts_password_at_bcrypt_byte_limit(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "ą" * 36},
    )
    assert response.status_code == 201


def test_login_returns_jwt_for_valid_credentials(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert decode_access_token(data["access_token"])["sub"] == "1"


def test_login_accepts_username(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )

    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice", "password": "secret"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )

    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice@example.com", "password": "wrong"},
    )
    missing_user = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "missing@example.com", "password": "secret"},
    )

    assert wrong_password.status_code == 401
    assert missing_user.status_code == 401


def test_get_current_user_returns_user_from_token(
    client: TestClient,
    db_session_factory: sessionmaker[Session],
) -> None:
    client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice@example.com", "password": "secret"},
    )

    with db_session_factory() as db:
        current_user = get_current_user(token=login_response.json()["access_token"], db=db)

    assert current_user.username == "alice"


def test_me_requires_bearer_token(client: TestClient) -> None:
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_my_stats_requires_bearer_token(client: TestClient) -> None:
    response = client.get("/api/v1/users/me/stats")

    assert response.status_code == 401


def test_me_returns_current_user(client: TestClient) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice@example.com", "password": "secret"},
    )

    response = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == register_response.json()["id"]
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"
    assert "hashed_password" not in data


def test_my_stats_counts_completed_game_results(
    client: TestClient,
    db_session_factory: sessionmaker[Session],
) -> None:
    register_response = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "secret"},
    )
    login_response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "alice@example.com", "password": "secret"},
    )
    user_id = register_response.json()["id"]

    with db_session_factory() as db:
        games = [
            Game(current_fen="start", result="white_wins"),
            Game(current_fen="start", result="black_wins"),
            Game(current_fen="start", result="draw"),
            Game(current_fen="start"),
            Game(current_fen="start", status="aborted", result="aborted"),
        ]
        db.add_all(games)
        db.flush()
        db.add_all(
            [
                GamePlayer(game_id=games[0].id, user_id=user_id, color="white", result="win"),
                GamePlayer(game_id=games[1].id, user_id=user_id, color="black", result="loss"),
                GamePlayer(game_id=games[2].id, user_id=user_id, color="white", result="draw"),
                GamePlayer(game_id=games[3].id, user_id=user_id, color="black", result=None),
                GamePlayer(game_id=games[4].id, user_id=user_id, color="white", result="draw"),
            ]
        )
        db.commit()

    response = client.get(
        "/api/v1/users/me/stats",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json() == {"wins": 1, "losses": 1, "draws": 1, "games_played": 3}
