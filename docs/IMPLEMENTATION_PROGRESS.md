# Implementation checkpoint

Objective: improve the navigation and learning screens while preserving the chess MVP, following [project instructions](../AGENTS.md).

## Working state

- `feature/learning-ui` starts from `main`. It updates navigation, lessons, puzzles and examples, and adds an opening selector. Only the Italian Game has guide content; the other listed openings are unavailable.
- Preserve the unreviewed local stash and `handoff/stash-recovery` branch. Inspect Git status and worktrees before resuming.

## Checks

- Frontend: `cd frontend && npm test && npm run lint && npm run build` (28 tests passed).
- Browser: board, lessons, puzzles, opening, settings, teaching, mobile and real-content learning checks passed; two-player smoke passed against disposable SQLite services.
- PostgreSQL-specific checks were not rerun. See [Contributing](../CONTRIBUTING.md) for disposable PostgreSQL setup.
