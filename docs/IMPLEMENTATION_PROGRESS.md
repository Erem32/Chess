# Implementation checkpoint

Objective: implement [teaching examples](features/teaching-examples.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/teaching-examples` starts from `main`. Three authored examples use server-validated moves and a read-only guide shared with opening study.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Backend: `cd backend && pytest -q app/tests/test_teaching_api.py app/tests/test_opening_api.py` (8 passed); Ruff passed.
- Frontend: `cd frontend && npm test && npm run lint && npm run build` (30 tests passed).
- Browser: with a frontend dev server running, set `CHESS_E2E_FRONTEND_URL` and `CHROME_PATH`, then run `npm run test:e2e:teaching`, `npm run test:e2e:opening`, and `npm run test:e2e:settings` (all passed with test-only API responses).
- Full backend and two-player tests were not rerun locally. No online game or board rules were changed.
