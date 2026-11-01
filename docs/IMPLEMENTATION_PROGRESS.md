# Implementation checkpoint

Objective: prepare a small university-project version of the [Project Helix feature plan](features/README.md), following [project instructions](../AGENTS.md).

## Next task

Review the [simplified feature plan](features/README.md), then agree on the minimal board interface and choose a first approved feature slice. Preserve existing online play and add focused tests.

## Working state

- Current feature-planning work is on `docs/helix-feature-roadmap`, based on `docs/streamline-project-guidance`. Inspect `git status`, `git worktree list`, and recent commits before resuming; Git is authoritative. An unrelated edit to `.agents/skills/continue-chess-improvements/SKILL.md` is uncommitted and must be preserved.
- Local worktree `/tmp/chess-en-passant` contains uncommitted experimental edits. Preserve them; do not integrate them without a new request. Local stash `stash@{0}` and remote branch `handoff/stash-recovery` also contain unreviewed work.
- The running preview has its own database and may contain user data. Avoid restarting it during a game or using it for automated tests.

## Checks

For documentation changes, review the diff and verify local links. For code changes, use the relevant commands in [Contributing](../CONTRIBUTING.md). Run PostgreSQL and browser tests against disposable data, not the preview database.
