# Implementation checkpoint

Objective: provide an interactive lessons MVP for the [feature plan](features/interactive-lessons.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/interactive-lessons` starts from `main` after practice validation was merged. The Lessons page supports single-move exercises, server feedback and retry; the catalog remains empty.
- Remaining lesson work: author reviewed lessons and add multi-step lessons or explanations if needed. The legal-move guidance setting is a separate planned feature.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Backend: `cd backend && pytest -q app/tests/test_practice_api.py` (17 passed).
- Frontend: `cd frontend && npm test && npm run lint && npm run build` (29 tests passed).
- Browser: start the frontend dev server, then run `CHESS_E2E_FRONTEND_URL=http://127.0.0.1:5173 CHROME_PATH=/path/to/chrome npm run test:e2e:lessons` from `frontend` (passed using test-only API responses).
- Full backend and two-player checks were not rerun locally for this increment; CI runs them against disposable PostgreSQL.
