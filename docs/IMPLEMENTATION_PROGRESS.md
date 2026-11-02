# Implementation checkpoint

Objective: implement [display and move guidance settings](features/experience-settings.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/experience-settings` starts from `main`. Text size and legal-move marker settings persist in the browser and apply to the shared board.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Frontend: `cd frontend && npm test && npm run lint && npm run build` (30 tests passed).
- Browser: with a frontend dev server running, set `CHESS_E2E_FRONTEND_URL` and `CHROME_PATH`, then run `npm run test:e2e:settings` and `npm run test:e2e:board` from `frontend` (both passed).
- Two-player smoke passed against disposable SQLite with SQLAlchemy metadata; PostgreSQL migrations and concurrency were not checked. See [Contributing](../CONTRIBUTING.md) for disposable PostgreSQL setup.
