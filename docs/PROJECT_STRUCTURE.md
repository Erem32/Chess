# Project structure

This guide shows where to start when changing the online chess MVP. For setup, development accounts, and API endpoints, see the [README](../README.md).

## At a glance

| Path | Purpose |
| --- | --- |
| [frontend/](../frontend/) | React interface and browser-side API clients. |
| [backend/](../backend/) | FastAPI application, game logic, persistence, and tests. |
| [docker-compose.yml](../docker-compose.yml) | Starts the frontend, backend, and PostgreSQL services. |
| [docker-compose.preview.yml](../docker-compose.preview.yml) | Runs a local production frontend build with its own backend and database. |
| [.env.example](../.env.example) | Example development configuration. |
| [AGENTS.md](../AGENTS.md) | Instructions for coding agents, including project rules and checks. |
| [plan.md](../plan.md), [rules.md](../rules.md) | Project planning notes and team conventions; verify status claims against the code. |

The frontend sends HTTP requests and opens a game WebSocket to the backend. The backend uses PostgreSQL to store users, queue entries, games, moves, and chat messages. Server-side chess validation is the authority for game state.

## Backend

The Python application lives in [backend/app/](../backend/app/).

| Location | Responsibility |
| --- | --- |
| [main.py](../backend/app/main.py) | Creates the FastAPI app, health endpoint, and game WebSocket endpoint. |
| [api/v1/](../backend/app/api/v1/) | HTTP routes for auth, users, matchmaking, and games; [router.py](../backend/app/api/v1/router.py) groups them. |
| [api/deps.py](../backend/app/api/deps.py) | Dependencies including current-user authentication. |
| [core/](../backend/app/core/) | Configuration, password hashing, and JWT helpers. |
| [services/](../backend/app/services/) | Auth, matchmaking, game and chess behavior, user stats, and WebSocket connection management. |
| [repositories/](../backend/app/repositories/) | Database helpers for users, games, and matchmaking. |
| [models/](../backend/app/models/) | SQLAlchemy models for users, games, players, moves, queue entries, and chat messages. |
| [schemas/](../backend/app/schemas/) | Pydantic request and response types. |
| [db/](../backend/app/db/) | Database engine and sessions, model metadata, and development-user seeding. |
| [tests/](../backend/app/tests/) | Backend pytest suite. |
| [alembic/](../backend/alembic/) | Database migration configuration and versioned migrations. |

A typical HTTP request enters a route, calls a service, and reads or changes data through SQLAlchemy and repository helpers. Some game logic also queries models directly. Keep new business rules in services rather than route handlers.

### Useful files by task

| If you need to… | Start here |
| --- | --- |
| Change login or registration | [auth.py](../backend/app/api/v1/auth.py), [auth_service.py](../backend/app/services/auth_service.py), [security.py](../backend/app/core/security.py) |
| Change player matching | [matchmaking.py](../backend/app/api/v1/matchmaking.py), [matchmaking_service.py](../backend/app/services/matchmaking_service.py), [game_repository.py](../backend/app/repositories/game_repository.py) |
| Change move validation or game state | [chess_service.py](../backend/app/services/chess_service.py) and the WebSocket handler in [main.py](../backend/app/main.py) |
| Change resign, draw, history, or active-game endpoints | [games.py](../backend/app/api/v1/games.py), [game_service.py](../backend/app/services/game_service.py), and [chess_service.py](../backend/app/services/chess_service.py) |
| Change database tables | The relevant file in [models/](../backend/app/models/) and a new migration in [alembic/versions/](../backend/alembic/versions/) |
| Change settings or seeded users | [config.py](../backend/app/core/config.py), [seed.py](../backend/app/db/seed.py), and [.env.example](../.env.example) |

## Frontend

The React application lives in [frontend/src/](../frontend/src/).

| Location | Responsibility |
| --- | --- |
| [main.jsx](../frontend/src/main.jsx) | Mounts the app and providers. |
| [App.jsx](../frontend/src/App.jsx) | Defines page routes and the overall layout. |
| [pages/](../frontend/src/pages/) | Login, registration, dashboard, game, and history screens. |
| [components/](../frontend/src/components/) | Reusable interface pieces such as the chessboard, chat, navigation, and move history. |
| [api/](../frontend/src/api/) | REST calls, WebSocket connection, and token storage helpers. |
| [context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx) | Authentication state and login/logout actions. |
| [styles/](../frontend/src/styles/) | Shared CSS. |

## Follow the main flows

1. **Login:** [LoginPage.jsx](../frontend/src/pages/LoginPage.jsx) calls the frontend auth client. The backend auth route calls `auth_service` and security helpers. The frontend stores the returned token in browser storage and loads the current user once through the authentication provider. Protected routes offer a retry on temporary session-check failures and return an invalid session to login while preserving the requested destination.
2. **Matchmaking:** [DashboardPage.jsx](../frontend/src/pages/DashboardPage.jsx) requests a match and polls its status. The backend matchmaking service uses the database queue to return an existing game, wait for an opponent, or create a game.
3. **A move:** [ChessBoard.jsx](../frontend/src/components/ChessBoard.jsx) and [GamePage.jsx](../frontend/src/pages/GamePage.jsx) send a UCI move over the game WebSocket. The handler in `main.py` calls `chess_service.py`, which checks the player and turn, validates the move with python-chess, stores the result, and broadcasts the new state.
4. **Reloading a game:** The game page retrieves the current game and moves through REST, then connects to the WebSocket for live messages. Authorized, bounded chat history is available through the game chat API; the current game page does not yet reload it.

Moves, draw actions, resignations, and aborts lock affected game rows before changing their state. The database transaction serializes competing changes on PostgreSQL; abort locks games in ID order. Matchmaking uses a separate PostgreSQL advisory lock.

Backend tests are grouped by auth, matchmaking/game behavior, chess service, and health. Use the [README test commands](../README.md#tests-and-checks) and manually check both players when changing the live game flow.

The PostgreSQL concurrency tests in `test_game_concurrency_postgres.py` are skipped unless `TEST_POSTGRES_URL` points to a disposable PostgreSQL database whose name starts with `chess_test_`. They create and remove a unique schema in that database. They verify row-lock contention and competing game outcomes; SQLite tests do not verify PostgreSQL locking.
