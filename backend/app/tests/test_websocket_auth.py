import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app import main


class FakeSession:
    def close(self) -> None:
        pass


def test_invalid_socket_token_is_rejected_without_logging_it(monkeypatch, capsys, caplog) -> None:
    monkeypatch.setattr(main, "SessionLocal", FakeSession)
    token = "invalid-secret-token-for-test"

    with TestClient(main.app) as client:
        with client.websocket_connect(f"/ws/games/1?token={token}") as socket:
            assert socket.receive_json()["type"] == "error"
            with pytest.raises(WebSocketDisconnect) as exc:
                socket.receive_json()

    assert exc.value.code == 1008
    captured = capsys.readouterr()
    assert token not in captured.out + captured.err + caplog.text
