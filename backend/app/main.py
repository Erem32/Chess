from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models import User
from app.repositories import user_repository
from app.services.chess_service import (
    ChatMessageError,
    GameAccessError,
    GameNotActiveError,
    GameNotFoundError,
    IllegalMoveError,
    NotPlayerTurnError,
    apply_player_move,
    get_game_state_for_user,
    persist_chat_message,
)
from app.services.websocket_manager import websocket_manager

app = FastAPI(title=settings.project_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}

    return {"status": "ok", "database": "ok"}


app.include_router(api_router, prefix="/api/v1")


@app.websocket("/ws/games/{game_id}")
async def game_websocket(websocket: WebSocket, game_id: int) -> None:
    db = SessionLocal()
    user = _authenticate_websocket_user(websocket.query_params.get("token"), db)
    if user is None:
        await _close_unauthorized(websocket, "Could not validate credentials")
        db.close()
        return

    try:
        initial_state = get_game_state_for_user(db, game_id, user.id)
    except (GameAccessError, GameNotFoundError) as exc:
        await _close_unauthorized(websocket, str(exc))
        db.close()
        return

    await websocket_manager.connect(game_id, websocket)
    initial_state_sent = await websocket_manager.send(
        websocket,
        {"type": "game_state", "payload": {"game": initial_state}},
    )
    if not initial_state_sent:
        websocket_manager.disconnect(game_id, websocket)
        db.close()
        return

    try:
        while True:
            try:
                message = await websocket.receive_json()
            except ValueError:
                await _send_websocket_error(websocket, "WebSocket message must be valid JSON")
                continue
            await _handle_game_websocket_message(db, websocket, game_id, user.id, message)
    except WebSocketDisconnect:
        pass
    finally:
        websocket_manager.disconnect(game_id, websocket)
        db.close()


async def _handle_game_websocket_message(
    db: Session,
    websocket: WebSocket,
    game_id: int,
    user_id: int,
    message: dict,
) -> None:
    if not isinstance(message, dict):
        await _send_websocket_error(websocket, "WebSocket message must be a JSON object")
        return

    message_type = message.get("type")
    payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}

    if message_type == "move":
        move_uci = payload.get("move_uci") or payload.get("move") or message.get("move_uci") or message.get("move")
        if not isinstance(move_uci, str):
            await _send_websocket_error(websocket, "Move payload must include move_uci")
            return

        try:
            result = apply_player_move(db, game_id, user_id, move_uci)
        except (GameAccessError, GameNotActiveError, GameNotFoundError, IllegalMoveError, NotPlayerTurnError) as exc:
            db.rollback()
            await _send_websocket_error(websocket, str(exc))
            return

        await websocket_manager.broadcast(game_id, {"type": "game_state", "payload": result})
        return

    if message_type == "chat":
        chat_text = payload.get("message") or message.get("message")
        if not isinstance(chat_text, str):
            await _send_websocket_error(websocket, "Chat payload must include message")
            return

        try:
            chat_message = persist_chat_message(db, game_id, user_id, chat_text)
        except (ChatMessageError, GameAccessError, GameNotFoundError) as exc:
            db.rollback()
            await _send_websocket_error(websocket, str(exc))
            return

        await websocket_manager.broadcast(game_id, {"type": "chat", "payload": chat_message})
        return

    await _send_websocket_error(websocket, "Unsupported message type")


def _authenticate_websocket_user(token: str | None, db: Session) -> User | None:
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            return None
        user_id = int(subject)
    except (JWTError, ValueError):
        return None

    user = user_repository.get_user(db, user_id)
    if user is None or not user.is_active:
        return None
    return user


async def _send_websocket_error(websocket: WebSocket, message: str) -> None:
    await websocket_manager.send(websocket, {"type": "error", "payload": {"message": message}})


async def _close_unauthorized(websocket: WebSocket, message: str) -> None:
    await websocket.accept()
    await _send_websocket_error(websocket, message)
    await websocket.close(code=1008)
