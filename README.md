# Online Chess Platform

A university MVP for playing chess online. Two registered users can join a matchmaking queue, play a game in real time, chat, and view their games. The application consists of a React frontend, a FastAPI backend, and a PostgreSQL database.

The backend is responsible for game state and move legality. The project is a development MVP, not a production deployment.

## What is implemented

- Registration, login, password hashing, and JWT authentication.
- Database-backed matchmaking and game creation for two players.
- Server-side move validation with `python-chess`, persisted games and moves, and live updates over WebSockets.
- In-game chat, resignation, draw offers, game history, and basic user statistics.

These flows are under development; see [Current limitations](#current-limitations) and the manual checks below.

## Stack

| Part | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, react-chessboard, chess.js |
| Backend | Python, FastAPI, WebSockets, python-chess |
| Data | PostgreSQL, SQLAlchemy, Alembic |
| Development | Docker Compose, pytest |

For a guide to the folders and the path a request takes through the application, see [Project structure](docs/PROJECT_STRUCTURE.md). For the proposed technical and product roadmap, see the [Improvement plan](docs/IMPROVEMENT_PLAN.md).

## Run locally

Requirements: Docker and Docker Compose.

1. Clone the repository and enter it:

   ~~~bash
   git clone https://github.com/Erem32/Chess.git
   cd Chess
   ~~~

2. Optionally copy the example configuration. Compose also supplies the same development defaults when `.env` is absent:

   ~~~bash
   cp .env.example .env
   ~~~

3. Start the services:

   ~~~bash
   docker compose up --build
   ~~~

The backend waits for PostgreSQL, runs Alembic migrations, and seeds the development users before starting the API.

| Service | Address |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |
| Database health check | http://localhost:8000/health |
| PostgreSQL | localhost:5432 |

A successful health check returns `{"status":"ok","database":"ok"}`. Stop the services with `docker compose down`; the database volume is kept.

### Development accounts

The backend creates or resets these accounts on startup when `ENABLE_DEV_SEED_USERS=true`:

| Email or username | Password |
| --- | --- |
| `123@123.pl` or `123` | `123` |
| `321@321.pl` or `321` | `321` |

To test two players, use separate browser profiles or a normal window and a private window: login tokens are stored in browser local storage, which is shared by ordinary tabs from the same profile. Set `ENABLE_DEV_SEED_USERS=false` in `.env` to disable seeding. The sample passwords, database credentials, and secret key are for local development only.

### Configuration

The available development variables are listed in [.env.example](.env.example). They include `APP_ENV`, PostgreSQL credentials and `DATABASE_URL`, the JWT `SECRET_KEY` and token lifetime, CORS origins, the seed flag, and the frontend API/WebSocket URLs. Development Compose enables development seeding by default; the preview disables it, and outside Compose it is disabled by default.

Registration accepts a nonblank username of up to 50 characters and a nonempty password of at most 72 UTF-8 bytes; neither may contain null bytes. This password limit prevents bcrypt from silently ignoring trailing bytes. The current MVP does not enforce a minimum password strength.

If you change the PostgreSQL username, password, or database name, also update `DATABASE_URL` to match. PostgreSQL initializes these credentials when its volume is first created; changing them later may require additional database configuration. Never commit a real `.env` or secrets.

## Preview a production frontend build locally

This option builds the frontend with `npm run build` and serves the result with nginx. It runs a separate local backend and PostgreSQL database. It does not deploy anything or connect to the hosted database.

From the repository root, with Docker Desktop running:

~~~bash
docker compose -p chess-preview -f docker-compose.preview.yml up --build
~~~

- Frontend: http://localhost:5174
- Backend health check: http://localhost:8001/health

The preview uses a separate Docker project and database volume from the development setup. It disables the development seed accounts, so register new users to test it. Opening the preview and development URLs in separate browser profiles can help keep their login sessions distinct.

Press Ctrl+C to stop the logs. To remove the preview containers while keeping their database:

~~~bash
docker compose -p chess-preview -f docker-compose.preview.yml down
~~~

This checks a production frontend build, but does not reproduce every setting of the hosting provider.

## Hosting

The hosted deployment is configured in the hosting services, separately from the local Compose files. Confirm the actual frontend and backend providers, their deployment branches, and their release process before publishing. The repository includes `frontend/vercel.json`, but that file alone does not confirm the currently active hosting setup.

For the hosted frontend build, set `VITE_API_URL` to the public HTTPS backend address and `VITE_WS_URL` to its WSS address. Vite includes these values in the browser build, so they must not contain secrets.

On the hosted backend, explicitly set `APP_ENV=production`, configure the production `DATABASE_URL`, a strong randomly generated `SECRET_KEY` of at least 32 characters, the actual HTTPS frontend origins in `BACKEND_CORS_ORIGINS`, and `ENABLE_DEV_SEED_USERS=false`. Production configuration rejects the known development secret and database credentials, enabled seeding, and non-HTTPS or wildcard CORS origins. These checks cannot establish secret randomness or verify that a database is safe; generate and store credentials securely. The default environment is `development`, so the deployment must set `APP_ENV=production` explicitly. Keep credentials in the hosting provider's secret settings, not in the repository or a developer's local preview. The current backend startup runs Alembic migrations before starting the API; review database changes and the hosting release process before deployment.

## Tests and checks

With the services running:

~~~bash
docker compose exec backend pytest
docker compose exec frontend npm run build
~~~

The backend suite covers authentication, matchmaking, game operations, chess validation, chat persistence, and the health endpoint. A frontend build is not a substitute for a browser test. The CI workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) applies migrations to a disposable PostgreSQL database, runs the backend suite including PostgreSQL concurrency tests, and builds the frontend using the committed npm lockfile. Browser coverage is not yet automated.

For a manual smoke test, sign in as each development user in separate browser profiles, join matchmaking from both, make a move from each side, send a chat message, end the game by resignation or an agreed draw, and check the history. Also try refreshing the game page and reconnecting.

## Database migrations

Migrations are applied automatically on backend startup. To apply them manually:

~~~bash
docker compose exec backend alembic upgrade head
~~~

After changing models, generate and review a new migration:

~~~bash
docker compose exec backend alembic revision --autogenerate -m "describe change"
~~~

## API and WebSocket overview

The interactive API documentation at `/docs` is the most detailed reference for request and response schemas. Protected REST endpoints require a Bearer token.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` |
| Current user | `GET /api/v1/users/me`, `GET /api/v1/users/me/stats` |
| Matchmaking | `POST /api/v1/matchmaking/join`, `GET /api/v1/matchmaking/status`, `POST /api/v1/matchmaking/leave` |
| Games | `GET /api/v1/games/my-history`, `GET /api/v1/games/my-active`, `POST /api/v1/games/my-active/abort`, `GET /api/v1/games/{game_id}`, `GET /api/v1/games/{game_id}/moves` |
| Game actions | `POST /api/v1/games/{game_id}/resign`, `POST /api/v1/games/{game_id}/draw-offer`, `POST /api/v1/games/{game_id}/draw-offer/accept`, `POST /api/v1/games/{game_id}/draw-offer/decline` |

The game socket is `/ws/games/{game_id}?token=...` and is restricted to players in that game. A client can send:

The token is currently passed in the WebSocket URL. Configure reverse proxies, hosting access logs, and other request logging to redact query strings. Review existing logs for exposure and rotate credentials where appropriate. Application log redaction does not protect logs controlled by infrastructure.

~~~json
{"type": "move", "payload": {"move_uci": "e2e4"}}
~~~

~~~json
{"type": "chat", "payload": {"message": "Good luck!"}}
~~~

The server sends `game_state`, `chat`, and `error` messages. In a `game_state` message, the game is under `payload.game`, with fields including `id`, `current_fen`, `turn_color`, and `status`. After a move, the payload also includes the move and end-of-game flags. See [backend/app/main.py](backend/app/main.py) and [chess_service.py](backend/app/services/chess_service.py) for the current contract.

## Current limitations

- This is an MVP: two-browser gameplay, reconnection, and end-of-game flows need ongoing manual verification.
- Chat messages are stored by the backend, but the frontend does not currently restore chat history when a game page is reloaded.
- The WebSocket connection manager keeps connected clients in process memory; multi-instance operation is not implemented.
- A game may be aborted only before its first move; afterward a player can resign. Aborted games do not count as wins, losses, draws, or games played, including historical aborted games recorded with player draws.
- There is no computer opponent, Stockfish integration, puzzles, tournaments, or payments.

The project notes in [plan.md](plan.md) and [rules.md](rules.md) describe intended work and team conventions; check the current code when their status statements differ.
