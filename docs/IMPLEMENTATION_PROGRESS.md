# Implementation checkpoint

Objective: provide a puzzles MVP for the [feature plan](features/puzzles.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/puzzles-mvp` builds on `feature/interactive-lessons`; merge the lessons branch first or include it when reviewing. Both pages use server-validated single-move exercises. The catalog remains empty.
- Remaining work: author reviewed content and implement the separately planned legal-move guidance setting.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Backend: `cd backend && pytest -q app/tests/test_practice_api.py` (19 passed).
- Frontend: `cd frontend && npm test && npm run lint && npm run build` (29 tests passed).
- Browser: with a frontend dev server running, set `CHESS_E2E_FRONTEND_URL` and `CHROME_PATH`, then run `npm run test:e2e:puzzles` and `npm run test:e2e:lessons` from `frontend` (both passed using test-only API responses).
- Full backend and two-player checks were not rerun locally for this increment; CI runs them against disposable PostgreSQL.
