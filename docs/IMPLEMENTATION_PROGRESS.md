# Implementation checkpoint

Objective: implement the practice validation foundation for the revised [Project Helix features](features/README.md), following [project instructions](../AGENTS.md).

## Next task

Prepare `feature/practice-validation` for review against `main`. The practice catalog is empty; future lesson or puzzle work can add reviewed exercises using the documented format and connect the board callback to the practice API.

## Working state

- Practice validation is on `feature/practice-validation`, with the current `main` merged in. Inspect `git status`, `git worktree list`, and recent commits before resuming; Git is authoritative. The user's edits to the continuation skill and shared preparation document are included in this branch.
- Local worktree `/tmp/chess-en-passant` contains uncommitted experimental edits. Preserve them. Local stash `stash@{0}` and remote branch `handoff/stash-recovery` also contain unreviewed work.
- The running preview has its own database and may contain user data. Avoid restarting it during a game or using it for automated tests.

## Checks

Practice validation passed 16 focused tests and the full backend suite of 104 tests against disposable PostgreSQL, including migrations and concurrency tests; Ruff passed. The frontend passed 29 tests, lint, build and the browser board-component check. The earlier two-player smoke passed against isolated SQLite services; its database used SQLAlchemy metadata rather than migrations. The continuation skill passed its validator. Run PostgreSQL and browser tests against disposable data, not the preview database; see [Contributing](../CONTRIBUTING.md).
