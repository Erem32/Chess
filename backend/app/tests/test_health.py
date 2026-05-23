from fastapi.testclient import TestClient

from app import main
from app.main import app


class FakeSession:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def execute(self, statement):
        return None


def test_health_endpoint() -> None:
    main.SessionLocal = FakeSession
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
