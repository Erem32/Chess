# Implementation checkpoint

Objective: continue the [improvement plan](IMPROVEMENT_PLAN.md) in small, tested changes, following [project instructions](../AGENTS.md).

## Next task

Review the remaining game-session and dashboard responsibilities and choose a small extraction or contract improvement that makes future features easier without changing gameplay. Define acceptance criteria, add focused tests, and verify the affected two-player flow.

## Working state

- Current documentation work is on `docs/streamline-project-guidance`, based on `main`. Inspect `git status`, `git worktree list`, and recent commits before resuming; Git is authoritative.
- Local worktree `/tmp/chess-en-passant` contains uncommitted experimental edits. Preserve them; do not integrate them without a new request. Local stash `stash@{0}` and remote branch `handoff/stash-recovery` also contain unreviewed work.
- The running preview has its own database and may contain user data. Avoid restarting it during a game or using it for automated tests.

## Checks

For documentation changes, review the diff and verify local links. For code changes, use the relevant commands in [Contributing](../CONTRIBUTING.md). Run PostgreSQL and browser tests against disposable data, not the preview database.
