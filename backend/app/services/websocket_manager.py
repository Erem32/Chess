from collections import defaultdict

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, game_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[game_id].append(websocket)

    def disconnect(self, game_id: int, websocket: WebSocket) -> None:
        if websocket in self.active_connections[game_id]:
            self.active_connections[game_id].remove(websocket)

        if not self.active_connections[game_id]:
            del self.active_connections[game_id]

    async def send(self, websocket: WebSocket, message: dict) -> bool:
        if websocket.application_state != WebSocketState.CONNECTED:
            return False
        try:
            await websocket.send_json(message)
        except (RuntimeError, WebSocketDisconnect):
            return False
        return True

    async def broadcast(self, game_id: int, message: dict) -> None:
        for connection in list(self.active_connections[game_id]):
            sent = await self.send(connection, message)
            if not sent:
                self.disconnect(game_id, connection)


websocket_manager = WebSocketManager()
