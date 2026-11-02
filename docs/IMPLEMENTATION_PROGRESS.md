# Implementation checkpoint

Objective: provide opening study as described in the [feature plan](features/opening-study.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/opening-study` starts from `main` and provides a read-only guide with backend-validated moves. The content file is empty; author and review a guide separately.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Backend: `cd backend && pytest -q` against disposable SQLite (103 passed, 7 PostgreSQL concurrency tests skipped); `ruff check --no-cache app alembic` passed.
- Frontend: `cd frontend && npm test && npm run lint && npm run build` (29 tests passed).
- Browser: with a frontend dev server running, set `CHESS_E2E_FRONTEND_URL` and `CHROME_PATH`, then run `npm run test:e2e:opening` from `frontend` (passed using test-only API responses).
- The two-player smoke was not rerun locally; no live-game behavior was changed. CI runs it against disposable PostgreSQL.
