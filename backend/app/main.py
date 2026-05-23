from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal

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
    await websocket.accept()
    await websocket.send_json({"type": "info", "payload": {"message": "Game WebSocket scaffolded", "game_id": game_id}})
    await websocket.close()
