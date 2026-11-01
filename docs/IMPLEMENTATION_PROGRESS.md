# Implementation checkpoint

Objective: plan the revised [Project Helix features](features/README.md) in small, independently reviewable increments, following [project instructions](../AGENTS.md).

## Next task

Agree the minimal shared board interface described in [shared preparation](features/00-foundations.md): read-only positions, optional legal-move markers and a practice-only invalid-attempt callback. Define acceptance criteria and tests before implementation. Coordinate settings, lessons, puzzles and read-only views against example fixtures.

## Working state

- Feature-planning work is on `docs/helix-feature-roadmap`, based on `docs/streamline-project-guidance`. Inspect `git status`, `git worktree list`, and recent commits before resuming; Git is authoritative. An unrelated edit to `.agents/skills/continue-chess-improvements/SKILL.md` is uncommitted and must be preserved.
- Local worktree `/tmp/chess-en-passant` contains uncommitted experimental edits. Preserve them. Local stash `stash@{0}` and remote branch `handoff/stash-recovery` also contain unreviewed work.
- The running preview has its own database and may contain user data. Avoid restarting it during a game or using it for automated tests.

## Checks

For documentation changes, review the diff and verify local links. For code changes, use the relevant commands in [Contributing](../CONTRIBUTING.md). Run PostgreSQL and browser tests against disposable data, not the preview database.
