# Implementation checkpoint

Objective: integrate game history and compact page headers with the opening catalog, following [project instructions](../AGENTS.md).

## Working state

- `feature/history-overhaul` merges the current `main`, including 20 backend-validated opening guides. Completion is stored locally in the browser.
- History scrolls within the page and top-level screens share compact headers. Scrolling remains available for long content and small windows.
- Preserve unreviewed local stashes and `handoff/stash-recovery`. Inspect Git status and worktrees before resuming.

## Checks

- Integrated checks: 32 frontend unit tests, frontend lint and build; 114 backend tests passed with 7 PostgreSQL-specific tests skipped.
- Browser checks passed for opening study, learning content, headers, history UI, history pagination, and board viewports. Real-service checks used disposable SQLite.
- Reproduce: `cd frontend && npm test && npm run lint && npm run build`; `cd backend && pytest`. Browser scripts require a disposable running application and `CHESS_E2E_FRONTEND_URL` and `CHROME_PATH`; real-service scripts also require `CHESS_E2E_ALLOW_REGISTRATION=1`.
- PostgreSQL-specific checks were not rerun. See [Contributing](../CONTRIBUTING.md) for disposable PostgreSQL setup.
