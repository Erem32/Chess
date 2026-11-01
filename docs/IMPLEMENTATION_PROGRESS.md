# Implementation checkpoint

Objective: plan the revised [Project Helix features](features/README.md) in small, independently reviewable increments, following [project instructions](../AGENTS.md).

## Next task

Use the optional board invalid-attempt callback when implementing [piece lessons](features/interactive-lessons.md) or [puzzles](features/puzzles.md). Practice screens should send attempts to the backend for authoritative feedback; the board callback reports only the locally rejected source and target squares.

## Working state

- Board preparation is on `feature/board-practice-attempts`, based on `docs/helix-feature-roadmap`. Inspect `git status`, `git worktree list`, and recent commits before resuming; Git is authoritative. Existing uncommitted edits to `.agents/skills/continue-chess-improvements/SKILL.md` and `docs/features/00-foundations.md` must be preserved.
- Local worktree `/tmp/chess-en-passant` contains uncommitted experimental edits. Preserve them. Local stash `stash@{0}` and remote branch `handoff/stash-recovery` also contain unreviewed work.
- The running preview has its own database and may contain user data. Avoid restarting it during a game or using it for automated tests.

## Checks

The board change passed 29 frontend tests, lint and build, a browser component check for invalid click/drag and normal interactions, and the two-player smoke test against isolated SQLite services. The browser database used SQLAlchemy metadata rather than migrations. Run PostgreSQL and browser tests against disposable data, not the preview database; see [Contributing](../CONTRIBUTING.md).
