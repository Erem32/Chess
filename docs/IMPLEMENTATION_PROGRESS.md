# Implementation checkpoint

Objective: add [piece lessons](features/interactive-lessons.md), [puzzles](features/puzzles.md), and an [opening guide](features/opening-study.md), following [project instructions](../AGENTS.md).

## Working state

- `feature/learning-content` starts from `main` and adds six single-move piece lessons, three puzzles, and a short Italian Game guide.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Backend: `cd backend && pytest -q` against disposable SQLite (111 passed, 7 PostgreSQL concurrency tests skipped); Ruff passed.
- Frontend: `cd frontend && npm test && npm run lint && npm run build` (30 tests passed).
- Browser: `npm run test:e2e:learning` passed with real backend content and a disposable SQLite database initialized with SQLAlchemy metadata. Set `CHESS_E2E_ALLOW_REGISTRATION=1`, `CHESS_E2E_FRONTEND_URL`, and `CHROME_PATH`; see [Contributing](../CONTRIBUTING.md) for disposable services.
