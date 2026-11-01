# Contributing

The project is a React/FastAPI chess application. The backend is authoritative for game state and move legality. Read [AGENTS.md](AGENTS.md), [the project structure](docs/PROJECT_STRUCTURE.md), and [the implementation checkpoint](docs/IMPLEMENTATION_PROGRESS.md) before substantial work.

## Start locally

Use the [README setup](README.md#run-locally) for Docker Compose, environment variables, and optional development accounts. The [preview setup](README.md#preview-a-production-frontend-build-locally) uses a separate local database. Never commit a real `.env`, credentials, or database contents.

## Checks

With the Compose services running, the documented backend tests and frontend build are:

```bash
docker compose exec backend pytest
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

For local linting, create a Python 3.12 environment, install `backend/requirements-dev.txt`, and run `ruff check app alembic` from `backend/`. In `frontend/`, run `npm ci` followed by `npm run lint`. CI runs both focused linters; these are not full formatting checks.

The standard backend suite skips PostgreSQL-specific contention tests unless `TEST_POSTGRES_URL` points to a **disposable** PostgreSQL database whose name starts with `chess_test_`. Those tests create and delete an isolated schema. CI uses a disposable database for migration and concurrency checks. Do not use a database containing data you need to keep.

The [two-player browser smoke test](frontend/e2e/two-player.cjs) registers accounts and creates games. Run it only against a disposable environment, following the [README instructions](README.md#tests-and-checks). It covers a basic play loop; it does not replace accessibility, mobile, real-network interruption, or full chess-rule testing.

## Make a change

1. Inspect the current branch, uncommitted files, worktrees, and the checkpoint. Preserve other people's work. Use a separate branch or worktree for independent work.
2. Define the user-visible behavior and failure cases. Keep routes thin, put rules in backend services, and keep state transitions transactional. Never rely on frontend legality checks as authority.
3. Add focused tests, run the relevant checks, and update the README or structure guide when contracts, behavior, setup, or files change. For database changes, create and review an Alembic migration; test against a disposable PostgreSQL database.
4. Review the diff for unrelated work, secrets, and generated files. Make small descriptive commits with their tests and documentation. Describe what changed, how it was tested, and any remaining limitations when requesting review.
5. For long-running roadmap work, update the checkpoint after each increment. For interrupted work, use the [handoff guide](docs/HUMAN_HANDOFF.md) and the repository skills under `.agents/skills/`.

Do not force-push, deploy, or change production data without the appropriate authorization. Follow the project scope rules in `AGENTS.md` and ask about consequential product decisions.
