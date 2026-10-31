---
name: chess-receive-handoff
description: Recover and inspect Chess project handoff branches or a Git bundle and prepare to resume interrupted work. Use when receiving a repository transfer or restoring work from another machine.
---

# Receive a Chess handoff

Read `AGENTS.md`, `docs/IMPLEMENTATION_PROGRESS.md`, `docs/IMPROVEMENT_PLAN.md`, and `docs/HUMAN_HANDOFF.md`. Discover actual remote refs or inspect the supplied bundle; local paths and hashes in a checkpoint may have changed. Verify the remote and sender's intended integration branch and preserve all existing local work.

Fetch the relevant named branches without overwriting local work, or verify and fetch named refs from the supplied bundle. Compare each branch's ancestry and diffs against the integration branch. WIP branches are snapshots, not completed or tested changes. Review potential secrets, untracked or private artifacts not included, migration effects, dependencies, merge conflicts, and tests before applying anything. Do not merge a branch merely because it exists.

Reconcile the checkpoint with Git and actual source; identify missing or conflicting work, what has been tested, and the exact next task. Use an isolated branch/worktree for independent development, and integrate reviewed changes with focused tests and documentation. Never reset, clean, force-push, or overwrite the recipient's changes. If required work or credentials are missing, explain what is missing and continue safe independent work.

For the roadmap execution workflow, read and apply `.agents/skills/continue-chess-improvements/SKILL.md`. Report the received refs, verified state, outstanding risks, and remaining local-only work.
