# Online Chess Platform

Minimal, Dockerized university MVP for an online chess platform inspired by chess.com.

This repository currently contains a working project foundation: a FastAPI backend, a Vite React frontend, PostgreSQL through Docker Compose, an initial Alembic database migration, and clean folders for services, repositories, models, schemas, API routes, and tests.

## Stack

- Frontend: React + Vite
- Backend: Python FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Migrations: Alembic
- Auth target: JWT access tokens + hashed passwords
- Real-time target: FastAPI WebSockets
- Chess validation target: python-chess
- Testing: pytest and frontend build verification

## Run With Docker

Optional: copy the example environment file if you want to customize local settings:

```bash
cp .env.example .env
```

The default development database credentials are project-specific and safe for local Docker use:

- database: `online_chess`
- user: `online_chess_app`
- password: `online_chess_dev_password`

Start all services:

```bash
docker compose up --build
```

The backend container automatically runs `alembic upgrade head` before starting the API, so first-time setup creates the database tables for the committed schema.

If you previously started the project with different database credentials, reset the local Docker database volume before starting again:

```bash
docker compose down -v
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Backend health: http://localhost:8000/health
- PostgreSQL: localhost:5432

The health endpoint should return:

```json
{
  "status": "ok",
  "database": "ok"
}
```

## Migrations

The current initial migration is committed. To apply migrations manually:

```bash
docker compose exec backend alembic upgrade head
```

When models change later, create a new migration:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
```

## Backend Tests

```bash
cd backend
pytest
```

Or through Docker:

```bash
docker compose exec backend pytest
```

## Frontend Build

```bash
cd frontend
npm install
npm run build
```

Or through Docker:

```bash
docker compose exec frontend npm run build
```

## Main API Endpoints

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `GET /api/v1/users/me/stats`
- `POST /api/v1/matchmaking/join`
- `POST /api/v1/matchmaking/leave`
- `GET /api/v1/games/{game_id}`
- `GET /api/v1/games/{game_id}/moves`
- `GET /api/v1/games/my-history`
- `POST /api/v1/games/{game_id}/resign`
- `WebSocket /ws/games/{game_id}?token=...`

Most feature routes are scaffolded for the MVP and should be implemented in services, not directly inside route files. The current priority is reliable project setup and connectivity for team handoff.

## WebSocket Messages

Client move:

```json
{
  "type": "move",
  "payload": {
    "move": "e2e4"
  }
}
```

Server game state:

```json
{
  "type": "game_state",
  "payload": {
    "game_id": 1,
    "fen": "...",
    "turn_color": "black",
    "status": "active",
    "last_move": "e2e4"
  }
}
```

Error:

```json
{
  "type": "error",
  "payload": {
    "message": "Illegal move"
  }
}
```

Chat:

```json
{
  "type": "chat",
  "payload": {
    "message": "Good luck!"
  }
}
```

## MVP Limitations

- No Stockfish, puzzles, tournaments, payments, advanced rankings, or AI opponent.
- Chess rules, matchmaking, persistence, auth, and WebSocket gameplay are organized but not fully implemented in this scaffold.
- The backend must remain the source of truth for chess legality and game state.

## Future Extensions

- Complete registration/login and JWT-protected routes.
- Implement database-backed matchmaking.
- Implement move validation and persistence with `python-chess`.
- Add persisted chat messages.
- Add richer profile, history, and game review pages.
