# Implementation checkpoint

Objective: fit board-focused screens and their primary controls in common viewport sizes, following [project instructions](../AGENTS.md).

## Working state

- `feature/viewport-board` builds on `feature/smooth-loading`. Merge or include that branch first when reviewing.
- The layout keeps scrolling available for long content, expanded controls or unusually small windows.
- Preserve unreviewed local stashes and `handoff/stash-recovery`; inspect Git status and worktrees before resuming.

## Checks

- Frontend: `cd frontend && npm test && npm run lint && npm run build` (28 tests passed).
- Browser: `test:e2e:viewport`, `test:e2e:mobile`, `test:e2e:loading`, and two-player smoke passed using disposable SQLite services. PostgreSQL-specific checks were not rerun.
