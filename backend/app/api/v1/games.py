from fastapi import APIRouter, WebSocket

router = APIRouter()


@router.get("/my-history")
def my_game_history() -> dict[str, list]:
    return {"games": []}


@router.get("/{game_id}")
def get_game(game_id: int) -> dict[str, int | str]:
    return {"message": "Game endpoint scaffolded", "game_id": game_id}


@router.get("/{game_id}/moves")
def get_game_moves(game_id: int) -> dict[str, int | list]:
    return {"game_id": game_id, "moves": []}


@router.post("/{game_id}/resign")
def resign_game(game_id: int) -> dict[str, int | str]:
    return {"message": "Resign endpoint scaffolded", "game_id": game_id}


@router.websocket("/ws/games/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: int) -> None:
    await websocket.accept()
    await websocket.send_json({"type": "info", "payload": {"message": "Game WebSocket scaffolded", "game_id": game_id}})
    await websocket.close()
