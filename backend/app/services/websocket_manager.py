from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, game_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[game_id].append(websocket)

    def disconnect(self, game_id: int, websocket: WebSocket) -> None:
        if websocket in self.active_connections[game_id]:
            self.active_connections[game_id].remove(websocket)

    async def broadcast(self, game_id: int, message: dict) -> None:
        for connection in self.active_connections[game_id]:
            await connection.send_json(message)


websocket_manager = WebSocketManager()
