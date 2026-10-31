import asyncio
import socket
import subprocess
import sys
import time

import pytest
import websockets
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


def test_uvicorn_handshake_does_not_log_socket_query(tmp_path) -> None:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]

    token = "invalid-token-uvicorn-regression-check"
    log_path = tmp_path / "uvicorn.log"
    with log_path.open("w+") as log:
        process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
            stdout=log,
            stderr=subprocess.STDOUT,
        )
        try:
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                if process.poll() is not None:
                    pytest.fail("Uvicorn exited before accepting connections")
                try:
                    with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                        break
                except OSError:
                    time.sleep(0.05)
            else:
                pytest.fail("Uvicorn did not start")

            async def connect():
                async with websockets.connect(f"ws://127.0.0.1:{port}/ws/games/1?token={token}") as ws:
                    assert '"type":"error"' in await ws.recv()

            asyncio.run(connect())
        finally:
            process.terminate()
            process.wait(timeout=10)
        log.seek(0)
        output = log.read()

    assert "WebSocket /ws/games/1" in output
    assert token not in output
    assert "?token=" not in output
