# Project Rules and Current Reality

## What This Project Is

This is a Dockerized online chess MVP with:

- React + Vite frontend
- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- Alembic migrations
- JWT authentication
- WebSocket-based live gameplay

The backend is the authority for game state and move legality.

## What Is Already Working

- The repository structure is clean and expandable
- Docker Compose starts the main services
- PostgreSQL is local and containerized
- Alembic migrations are committed and run on backend startup
- Backend auth endpoints exist and work
- Local seed users exist for development
- Matchmaking can create games
- Games and moves are stored in the database
- The backend validates UCI moves using `python-chess`
- Backend tests pass
- Frontend build passes

## Important Setup Rules

### Database handling

- The team should not hand off a raw local database dump as the main setup path
- The handoff path is:
  - clone repo
  - create `.env` from `.env.example`
  - run `docker compose up --build`
- The database schema should come from Alembic migrations
- Local dev data can come from seed logic, not from manually shared database files

### Environment handling

- `.env.example` is committed
- `.env` should stay local and uncommitted
- Docker is the main development environment
- A local Python `venv` is optional, not required for normal team setup

### Authentication handling

- JWT tokens are used for API and WebSocket auth
- Protected routes use Bearer token auth
- WebSocket auth uses `/ws/games/{game_id}?token=...`
- Session separation matters when testing two users at once
- The current frontend stores the token in local storage, so normal tabs in one browser profile share a login. Use separate browser profiles or a normal and a private window for two accounts.

## Backend Design Rules

- Keep route files thin
- Put business logic in services
- Put persistence helpers in repositories
- Keep SQLAlchemy models focused on data shape
- Keep schemas focused on request/response contracts
- Do not move core logic into route handlers just because it is faster

## Chess Rules

- Final move legality must stay server-side
- The frontend may assist with drag/drop and UI hints, but it must not be the final judge
- The backend owns:
  - current FEN
  - turn color
  - game status
  - move validation
  - move persistence
  - result updates

## Matchmaking Rules

- Matchmaking must remain backend-driven
- Queue and game creation should stay database-backed
- The frontend should only reflect current matchmaking state
- Two users waiting should produce one active game, not two isolated waiting states

## WebSocket Lessons Learned

### 1. Read paths must not take unnecessary row locks

This was a real issue.

- Initial WebSocket game-state fetches were going through a locking database path
- That could block one player before the socket reached `accept()`
- Only mutation flows such as move application should lock the game row

### 2. WebSocket acceptance order matters

- If one client authenticates but never reaches accepted/open state, look at backend flow before assuming the frontend is the only issue
- Backend logs are critical for diagnosing where the socket stopped

### 3. Reconnect behavior must be controlled

- Over-eager reconnect loops can make the UI feel broken
- Duplicate effect execution in development can be amplified by React Strict Mode
- WebSocket lifecycle logic should be written carefully and tested with two independent browser sessions

## Frontend Rules

- Keep the frontend as a client of backend truth
- Do not create client-only chess state that can drift from the server
- Prefer reloading current game state from REST after refresh
- WebSocket should handle live updates, not become the only source of recoverable state

## Testing Reality

### Already verified

- Backend pytest suite passes
- Frontend build succeeds
- Dockerized startup works when Docker itself is running correctly

### Still needs ongoing manual checking

- Two-browser matchmaking every time
- Two-browser WebSocket connection every time
- Board orientation per player color
- End-of-game transitions
- Refresh and reconnect behavior

## Local Development Notes

Seed users for testing:

- `123@123.pl` / `123`
- `321@321.pl` / `321`

Useful commands:

```bash
docker compose up --build
docker compose exec backend pytest
docker compose exec backend alembic upgrade head
docker compose exec frontend npm run build
docker compose logs -f backend
```

## Current Practical Priorities

- Rework the UI so it looks intentional
- Show pieces and move hints clearly
- Remove flickering and unstable connection states
- Make gameplay solid between two browsers
- Finish and polish game-ending logic

## Scope Protection

Until the MVP is stable, do not expand into:

- Stockfish
- AI opponent
- puzzles
- tournaments
- advanced ranking systems
- large admin tooling
- unrelated platform features
