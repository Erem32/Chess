# AGENTS.md

## Project Structure

- `backend/app/api/v1`: FastAPI route modules. Keep route handlers thin.
- `backend/app/services`: Business logic such as auth, matchmaking, chess rules, game flow, and WebSocket coordination.
- `backend/app/repositories`: Database read/write helpers.
- `backend/app/models`: SQLAlchemy database models.
- `backend/app/schemas`: Pydantic request and response schemas.
- `backend/app/db`: SQLAlchemy engine, session, and base metadata.
- `backend/app/tests`: pytest tests.
- `frontend/src/api`: HTTP and WebSocket clients.
- `frontend/src/components`: Reusable UI components.
- `frontend/src/pages`: Page-level React screens.
- `frontend/src/context`: React providers such as authentication state.
- `frontend/src/styles`: Global styles.

## Commands

Run all services:

```bash
docker compose up --build
```

The backend Docker command runs `alembic upgrade head` automatically before starting FastAPI.

Verify API and database connectivity:

```bash
curl http://localhost:8000/health
```

Run backend tests:

```bash
cd backend
pytest
```

Run frontend build:

```bash
cd frontend
npm install
npm run build
```

Run migrations:

```bash
docker compose exec backend alembic upgrade head
```

## Coding Conventions

- Keep business logic out of API route files.
- Prefer service classes/functions for workflows and repository functions for persistence.
- Keep frontend state simple until the MVP needs more structure.
- Add focused tests when implementing a feature.
- Use environment variables for configuration.
- Keep comments useful and brief.

## Project Rules

- Do not bypass backend chess validation. The frontend may help the user choose moves, but the backend is always the source of truth.
- Do not introduce huge features without asking first.
- Do not add Stockfish, tournaments, payments, advanced rankings, or admin features during the MVP unless explicitly requested.
