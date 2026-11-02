# Implementation checkpoint

Objective: improve game history and unify compact page headers, following [project instructions](../AGENTS.md).

## Working state

- `feature/history-overhaul` starts from `main`. History presents game details and scrolls within the page; top-level screens share compact headers.
- Preserve unreviewed local stashes and `handoff/stash-recovery`. Inspect Git status and worktrees before resuming.

## Checks

- Frontend: `cd frontend && npm test && npm run lint && npm run build` (30 tests passed).
- Browser: `test:e2e:headers`, `test:e2e:history-ui`, `test:e2e:history`, `test:e2e:viewport`, `test:e2e:mobile`, `test:e2e:loading`, and two-player smoke passed. Real-service checks used disposable SQLite; PostgreSQL-specific checks were not rerun.
