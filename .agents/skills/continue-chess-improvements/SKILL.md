---
name: continue-chess-improvements
description: Resume or continue the long-running Chess improvement roadmap from its durable checkpoint. Use when asked to continue the repository improvement project after interruption or a handoff.
---

# Continue Chess improvements

Read `AGENTS.md`, `docs/IMPROVEMENT_PLAN.md`, and `docs/IMPLEMENTATION_PROGRESS.md`. Inspect the current branch, status, worktrees, recent commits, in-progress merges and relevant remote refs; preserve all existing work. Reconcile the checkpoint with actual source and tests. If recovering someone else's transfer, also read `.agents/skills/chess-receive-handoff/SKILL.md`.

Continue the highest-priority unblocked task supported by the roadmap and the user’s request. If only evaluation remains, do not invent participants, results, or new features; report what requires the owner’s involvement. Break work into small increments with an explicit outcome, focused tests, review, affected documentation, checkpoint update, and descriptive commit. The backend remains authoritative for game state and move legality. Confirm the relevant product decisions recorded in the checkpoint; do not silently change abort rules or stored historical data.

When available and authorized, delegate independent scopes to agents in separate worktrees/branches. Track ownership and incomplete work; review, integrate and test each result. Unverified WIP branches are not completed features. Preserve them across interruption.

Keep `docs/IMPLEMENTATION_PROGRESS.md` current with the objective, actual branch/worktree mapping, status, tests, risks, decisions and the exact next task. Git and actual behavior override stale notes. Continue safe independent work if a product decision, external credential or deployment action is blocked. Do not claim completion or test success without evidence.

Make cohesive, descriptive commits; squash unpublished intermediate commits when useful. Push reviewed work to feature branches. Merge when reasonable. When a merge to main is ready to be done, prepare it, tell the user and ask for approval. Never force-push or deploy without explicit authorization. For transfer, use `.agents/skills/chess-handoff/SKILL.md` and `docs/HUMAN_HANDOFF.md`.
