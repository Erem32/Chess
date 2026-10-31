---
name: chess-handoff
description: Preserve and transfer interrupted Chess repository work, including uncommitted changes in multiple worktrees, so another developer can resume. Use when asked to hand off, recover, or publish unfinished local work.
---

# Hand off interrupted Chess work

Read `AGENTS.md`, `docs/IMPLEMENTATION_PROGRESS.md`, and `docs/HUMAN_HANDOFF.md`. The repository and Git are the evidence; prior conversation may be unavailable. Follow the human guide for the full recovery procedure.

1. Inspect every relevant worktree and branch, the index, untracked files, merge/rebase state, stashes, recent commits, and the actual remote refs. Do not assume the current worktree contains all work. Avoid printing credentials or private data.
2. Identify the owner and purpose of each change. Preserve staged versus unstaged and conflicts as needed. Never reset, clean, overwrite, force-push, or delete another person's work. Check ignored and untracked items for required artifacts, but do not upload `.env`, credentials, local databases, dependencies, build outputs, private data, or other ignored files indiscriminately. Report excluded work and safe ways to transfer any genuinely necessary private artifact.
3. Prepare a concise checkpoint: objective, branch/worktree/commit map, unfinished work and exact next action, validation actually performed, decisions, conflicts, and blockers. Mark unverified or incomplete work clearly. Never claim a worktree path exists on the receiver's machine.
4. When authorized to publish, preserve each coherent unfinished worktree on a distinct clearly named WIP branch with a commit containing only inspected, intended files. If there is an unresolved conflict or unknown ownership, preserve and describe it rather than guessing; a Git bundle of committed refs does not capture uncommitted work. Review each diff for secrets before committing and pushing. Never claim a WIP snapshot is tested or production-ready.
5. Push only authorized branches to the intended remote using normal non-force pushes; verify exact remote ref hashes afterward. If authentication, permissions, network, or remote conflicts prevent publishing, stop retrying and report the exact problem. A local commit or local bundle is not an upload. Create a Git bundle of the explicitly chosen committed refs as an optional offline transfer artifact if useful and safe; verify it and give the human secure transfer instructions. Uncommitted, ignored and stashed content are not automatically included.
6. Update and commit the checkpoint after snapshot hashes are known. Report exact pushed refs/hashes, items that remain local, bundle location if any, and the next action for the recipient. Do not invent a successful upload or send a message to another person without instruction.
