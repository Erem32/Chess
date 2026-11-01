# Online Chess Platform

A university MVP for playing chess online. Two registered users can join a matchmaking queue, play a game in real time, chat, and view their games. The application consists of a React frontend, a FastAPI backend, and a PostgreSQL database.

The backend is responsible for game state and move legality. The project is a development MVP, not a production deployment.

## What is implemented

- Registration, login, password hashing, and JWT authentication.
- Database-backed matchmaking and game creation for two players.
- Server-side move validation with `python-chess`, persisted games and moves, and live updates over WebSockets.
- Board interaction by clicking or dragging pieces, including promotion choices.
- In-game chat, resignation, draw offers, game history, and basic user statistics.

## Stack

| Part | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, react-chessboard, chess.js |
| Backend | Python, FastAPI, WebSockets, python-chess |
| Data | PostgreSQL, SQLAlchemy, Alembic |
| Development | Docker Compose, pytest |

For a guide to the folders and the path a request takes through the application, see [Project structure](docs/PROJECT_STRUCTURE.md). For the proposed technical and product roadmap, see the [Improvement plan](docs/IMPROVEMENT_PLAN.md).

The [Project Helix feature plan](docs/features/README.md) breaks the proposed learning and play features into independently reviewable briefs and prerequisites.

For the development workflow, see [Contributing](CONTRIBUTING.md). For interrupted work, see the [implementation checkpoint](docs/IMPLEMENTATION_PROGRESS.md) and [human handoff guide](docs/HUMAN_HANDOFF.md). Reusable agent workflows live in `.agents/skills/`.

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
docker compose exec frontend npm test
docker compose exec frontend npm run build
~~~

The CI workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs tests and lint checks, applies migrations to disposable PostgreSQL, and runs browser smoke tests.

For backend linting, install `backend/requirements-dev.txt` in a Python environment and run `ruff check app alembic` from `backend/`. Run `npm run lint` from `frontend/` after `npm ci` for focused JavaScript checks. CI runs both linters; their initial rule sets are intentionally limited.

To run the browser smoke test separately, start frontend and backend services against a disposable database, then run `CHESS_E2E_ALLOW_REGISTRATION=1 CHESS_E2E_FRONTEND_URL=http://127.0.0.1:5173 CHROME_PATH=/path/to/chrome npm run test:e2e` from `frontend/`. It registers users and creates games; never point it at a database whose contents must remain unchanged.

The history pagination browser test also requires `CHESS_E2E_API_URL` pointing to the disposable backend: `CHESS_E2E_ALLOW_REGISTRATION=1 CHESS_E2E_FRONTEND_URL=http://127.0.0.1:5173 CHESS_E2E_API_URL=http://127.0.0.1:8000 CHROME_PATH=/path/to/chrome npm run test:e2e:history`. It creates two users and 22 games, and checks dashboard results, older pages, and retry after a simulated failed request.

The chat history browser test additionally needs `CHESS_E2E_WS_URL=ws://127.0.0.1:8000`; with the other variables above, run `npm run test:e2e:chat` against disposable services. It creates users, a game and more than 200 messages to check older pages, live arrivals and retry.

To test the board component without a backend, start the frontend development server and run `CHESS_E2E_FRONTEND_URL=http://127.0.0.1:5173 CHROME_PATH=/path/to/chrome npm run test:e2e:board` from `frontend/`.

For a manual smoke test, sign in as each development user in separate browser profiles, join matchmaking from both, make a move from each side, send a chat message, end the game by resignation or an agreed draw, and check the history. Also try refreshing the game page and reconnecting.

## Database migrations

Migrations are applied automatically on backend startup. To apply them manually:

~~~bash
docker compose exec backend alembic upgrade head
~~~

The chat-history index migration uses a standard PostgreSQL index build, which blocks writes to `chat_messages` while the index is built. For an existing large deployment, plan the migration and startup accordingly.

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
| Practice | `GET /api/v1/practice/exercises`, `POST /api/v1/practice/exercises/{exercise_id}/attempt` |
| Games | `GET /api/v1/games/my-history`, `GET /api/v1/games/my-active`, `POST /api/v1/games/my-active/abort`, `GET /api/v1/games/{game_id}`, `GET /api/v1/games/{game_id}/moves`, `GET /api/v1/games/{game_id}/chat` |
| Game actions | `POST /api/v1/games/{game_id}/resign`, `POST /api/v1/games/{game_id}/draw-offer`, `POST /api/v1/games/{game_id}/draw-offer/accept`, `POST /api/v1/games/{game_id}/draw-offer/decline`, `GET` and `POST /api/v1/games/{game_id}/draw-claims` |

Game history returns the current player's games in descending ID order. `GET /api/v1/games/my-history` returns `{ "games": [...], "next_before_id": ... }`; `limit` defaults to 20 and accepts 1–100. Pass a non-null `next_before_id` as `before_id` to retrieve the next older page. Existing API clients that need the full history must follow the cursor.

The authenticated practice API lists server-owned positions and validates submitted `move_uci` values as `illegal`, `incorrect` or `correct`; only a correct move advances the returned position. The catalog starts empty. See the [practice data format](backend/app/data/README.md) when adding exercises.

The game socket is `/ws/games/{game_id}?token=...` and is restricted to players in that game.

The server checks the token when the socket connects; an existing connection is not automatically closed when that token later expires. A reconnect requires a valid token.

The token is currently passed in the WebSocket URL. Configure reverse proxies, hosting access logs, and other request logging to redact query strings. Review existing logs for exposure and rotate credentials where appropriate. Application log redaction does not protect logs controlled by infrastructure.

Clients can send a move or chat message:

~~~json
{"type": "move", "payload": {"move_uci": "e2e4"}}
~~~

~~~json
{"type": "chat", "payload": {"message": "Good luck!"}}
~~~

Chat accepts a nonempty trimmed message of at most 1,000 Unicode characters without null bytes. A client may include a unique `client_message_id` of 1–64 ASCII letters, digits, underscores or hyphens in the chat payload; the server includes it in the corresponding successful `chat` event or validation `error`. Clients should correlate a successful event with both the ID and their own user ID. This acknowledgement does not make retries idempotent: a connection failure after persistence may leave delivery uncertain.

On their turn, a player can check draw-claim options in the game interface. The API accepts `{}` for the current position or `{"move_uci":"..."}` for a declared legal move. The server checks the claim under the game lock; a declared move is not played if the claim succeeds.

A game may be aborted only before its first move; afterward a player can resign. Aborted games are excluded from player statistics. Fivefold repetition and threefold claims require persisted moves to reconstruct the current position.

Game players can retrieve chat through `GET /api/v1/games/{game_id}/chat`, which returns `{ "game_id": ..., "messages": [...] }` in ascending message ID order. It returns the newest 100 messages by default; `limit` can be 1–100, and `before_id` requests an older page. Chat is stored without an automatic retention or deletion policy.

The game screen shows the latest chat messages and offers older pages when the latest page is full. Use **Latest messages** to return to the live view; new messages continue arriving while an older page is open.

The server sends `game_state`, `chat`, and `error` messages. After connection it sends `game_state` with `payload.game`; after a committed move, it broadcasts `game_state` with `payload.game`, `payload.move`, and the end-of-game flags. Each move has a per-game `move_number` and `fen_after_move` matching the accompanying game's `current_fen`. Older clients may send `move` instead of `move_uci`, either inside `payload` or at the top level; new clients should use the documented `payload.move_uci` shape. These messages are currently unversioned.

Resignation, draw actions and aborts use HTTP and are not broadcast as socket events. The game page polls for those changes about every two seconds. On reconnect, the client reloads game and move history and retries if those reads describe different states. See [backend/app/api/websocket.py](backend/app/api/websocket.py) and [chess_service.py](backend/app/services/chess_service.py) for the current contract.
