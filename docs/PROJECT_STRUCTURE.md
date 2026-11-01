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
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Developer workflow, checks, and contribution guidance. |
| [plan.md](../plan.md), [rules.md](../rules.md) | Project planning notes and team conventions; verify status claims against the code. |

The frontend sends HTTP requests and opens a game WebSocket to the backend. The backend uses PostgreSQL to store users, queue entries, games, moves, and chat messages. Server-side chess validation is the authority for game state.

## Backend

The Python application lives in [backend/app/](../backend/app/).

| Location | Responsibility |
| --- | --- |
| [main.py](../backend/app/main.py) | Creates the FastAPI app, health endpoint, and route registrations. |
| [api/v1/](../backend/app/api/v1/) | HTTP routes for auth, users, matchmaking, and games; [router.py](../backend/app/api/v1/router.py) groups them. |
| [api/deps.py](../backend/app/api/deps.py) | Dependencies including current-user authentication. |
| [api/websocket.py](../backend/app/api/websocket.py) | Authenticates game sockets, validates messages, and delegates game actions to services. |
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
| Change move validation or game state | [chess_service.py](../backend/app/services/chess_service.py) and the WebSocket handler in [websocket.py](../backend/app/api/websocket.py) |
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
| [components/](../frontend/src/components/) | Reusable interface pieces such as the chessboard, game action panels, chat, navigation, and move history. |
| [features/game/](../frontend/src/features/game/) | Shared game presentation, socket-event normalization, background state refresh, and chat acknowledgement tracking. |
| [api/](../frontend/src/api/) | REST calls, WebSocket connection, and token storage helpers. |
| [context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx) | Authentication state and login/logout actions. |
| [styles/](../frontend/src/styles/) | Shared CSS. |
| [frontend/e2e/](../frontend/e2e/) | Headless two-player smoke test for a disposable environment. |

## Follow the main flows

1. **Login:** [LoginPage.jsx](../frontend/src/pages/LoginPage.jsx) calls the frontend auth client. The backend auth route calls `auth_service` and security helpers. The frontend stores the returned token in browser storage and loads the current user once through the authentication provider. Protected routes offer a retry on temporary session-check failures and return an invalid session to login while preserving the requested destination.
2. **Matchmaking:** [DashboardPage.jsx](../frontend/src/pages/DashboardPage.jsx) requests a match and polls its status. The backend matchmaking service uses the database queue to return an existing game, wait for an opponent, or create a game.
3. **A move:** [ChessBoard.jsx](../frontend/src/components/ChessBoard.jsx) and [GamePage.jsx](../frontend/src/pages/GamePage.jsx) send a UCI move over the game WebSocket. The handler in `api/websocket.py` calls `chess_service.py`, which checks the player and turn, validates the move with python-chess, stores the result, and broadcasts the new state.
4. **Reloading a game:** The game page retrieves the current game and moves through REST, then connects to the WebSocket for live messages. After connecting or reconnecting it buffers live game events while reading a consistent game and move snapshot, then applies any newer moves. A temporary connection failure triggers retries with backoff; the board remains disabled during synchronization. The game page reloads bounded chat history and merges it with live messages by ID.

Moves, draw actions, resignations, and aborts lock affected game rows before changing their state. The database transaction serializes competing changes on PostgreSQL; abort locks games in ID order. Matchmaking uses a separate PostgreSQL advisory lock.

The game page uses `useGamePolling` for background updates to HTTP-driven game actions; the refresh controller ignores responses superseded by live events, newer polls, or page cleanup.

Game WebSockets open a database session for initial authorization and state, then a fresh session for each received message. Idle sockets do not retain a database session between messages.

Automatic fivefold repetition and threefold draw claims replay persisted UCI moves from the standard starting position and are applied only if the reconstructed FEN matches the stored current position. The server detects the 75-move rule and 50-move claims from the FEN. Claim requests are rechecked under the game row lock and do not play a declared move when successful.

Backend tests are grouped by auth, matchmaking/game behavior, chess service, and health. Use the [README test commands](../README.md#tests-and-checks) and manually check both players when changing the live game flow.

The PostgreSQL concurrency tests in `test_game_concurrency_postgres.py` are skipped unless `TEST_POSTGRES_URL` points to a disposable PostgreSQL database whose name starts with `chess_test_`. They create and remove a unique schema in that database. They verify row-lock contention and competing game outcomes; SQLite tests do not verify PostgreSQL locking.
