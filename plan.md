# Online Chess MVP Plan

## Current Status

The project is no longer just a scaffold. We already have a working base that the team can clone, run with Docker, and extend.

### Already done

- Dockerized monorepo structure with:
  - `backend/` for FastAPI
  - `frontend/` for React + Vite
  - PostgreSQL in `docker-compose.yml`
- SQLAlchemy models and Alembic migration for the core database schema
- Backend app structure split into:
  - API routes
  - services
  - repositories
  - models
  - schemas
- Frontend app structure split into:
  - pages
  - components
  - API helpers
  - auth context
- JWT login flow and hashed passwords
- Registration and login endpoints
- Authenticated user profile and stats endpoints
- Matchmaking queue and game creation flow
- Game persistence in PostgreSQL
- Game player assignment with white/black colors
- Move validation with `python-chess`
- Move storage and move history endpoints
- WebSocket game endpoint for live play
- Basic in-game chat message flow
- Seed test users for local Docker development
- Backend tests passing
- Frontend production build passing

## Primary Next Steps

These are the highest-value tasks for turning the current base into a strong demo-ready MVP.

### 1. UI rework

- Improve dashboard layout and overall visual structure
- Make the game page feel more stable and intentional
- Reduce debug-style presentation and polish the status area
- Improve history/profile page consistency
- Make the app feel like one product instead of a working prototype

### 2. Chessboard piece rendering

- Replace any weak placeholder rendering with clearer board pieces
- Add visible move targets or dots for legal UI hints
- Make color orientation obvious
- Ensure white sees white at the bottom and black sees black at the bottom

### 3. Remove flickering and unstable client behavior

- Audit React effects around login, dashboard load, game load, and WebSocket setup
- Reduce reconnect churn and duplicate UI state transitions
- Make refresh/rejoin behavior predictable
- Keep Strict Mode compatibility in mind while debugging

### 4. Solidify WebSocket gameplay

- Verify both players connect reliably every time
- Confirm reconnect behavior after refresh or temporary disconnect
- Ensure both players receive the same board state after every move
- Make socket status messages cleaner and more user-friendly

### 5. Solidify game-ending logic

- Make sure checkmate, stalemate, draw, resign, and abort all end the game cleanly
- Display a clear end-of-game state in the UI
- Prevent extra moves after the game is finished
- Confirm history/result persistence is correct
- Decide the exact expected behavior for disconnects during active games

## Secondary MVP Tasks

These matter, but come after the core play loop is stable.

- Persist and display chat history on reload
- Improve error messages for auth and gameplay edge cases
- Add clearer active game resume behavior from dashboard
- Tighten profile stats updates after completed games
- Add a lightweight loading strategy for route transitions

## Suggested Work Order

1. Stabilize WebSocket connection flow
2. Fix board interaction and piece presentation
3. Finalize game-ending behavior
4. Polish dashboard/game/history UI
5. Add targeted regression tests for the stabilized behavior

## MVP Scope Guardrails

Keep the team focused on the intended scope.

- Do not add AI opponent
- Do not add Stockfish
- Do not add tournaments
- Do not add rankings beyond simple stats
- Do not add payments or admin systems
- Do not move chess legality checks into the frontend

## Useful Additions Still Worth Doing

These are still within basic scope and would strengthen the handoff.

- Add a small architecture diagram to the README
- Add a short seed-data section in the handoff docs
- Add a test checklist for two-browser gameplay
- Add one or two backend tests around WebSocket-adjacent game state transitions
- Add a frontend smoke checklist for login -> matchmaking -> game -> resign/history
