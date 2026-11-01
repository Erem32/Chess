# Recover and hand off unfinished work

These steps preserve work for another developer. They do not deploy the application. Run them from a terminal on the source machine. Do not put passwords, tokens, `.env` files, databases, `node_modules`, or build output into Git or a bundle. If a required file contains private data, transfer it separately through an approved secure channel.

## 1. Find everything that needs preserving

```bash
cd /path/to/Chess
git status --short --branch
git worktree list
git branch -vv
git stash list
git remote -v
git log --all --oneline --decorate -20
```

For **each relevant path** from `git worktree list`, inspect `git -C /path/to/worktree status --short --branch`, `git -C /path/to/worktree diff`, and `git -C /path/to/worktree diff --cached`. Inspect untracked files individually. Check for an in-progress merge or rebase and do not reset, clean, delete, or overwrite work. A stash is local to the repository and is not transferred by an ordinary push. Worktree paths are local to this machine.

## 2. Save and document unfinished work

Read and update [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md): record the objective, relevant branch names and commits, unfinished changes, decisions, checks actually run, and what the next developer should do. Do not include secrets. Mark incomplete features and unverified documentation as WIP.

For each worktree with changes you own and intend to share, carefully review the files and stage only the intended, non-secret paths. Then create a WIP commit **on that worktree's own branch**, for example:

```bash
git -C /path/to/worktree add path/to/reviewed-file
git -C /path/to/worktree diff --cached --check
git -C /path/to/worktree diff --cached
git -C /path/to/worktree commit -m "WIP: preserve unfinished feature"
```

Repeat `git add` for each reviewed path. Never use a blanket add without inspecting all files. If a merge conflict, stash, ignored file, unknown ownership, missing identity, or credential requires attention, do not guess or discard it; document it and ask the owner. A normal commit cannot represent an unresolved merge. Commit the updated checkpoint on the appropriate project branch once WIP hashes are known.

For a relevant stash you own, inspect it first with `git stash show --include-untracked -p 'stash@{0}'` (choose the correct entry and avoid displaying secrets). To preserve the stash, create a new worktree and branch from its base with `git worktree add -b handoff/stash-recovery /safe/new/path 'stash@{0}^1'`, then run `git -C /safe/new/path stash apply --index 'stash@{0}'`. Inspect the restored files and commit only the intended content as above. Applying can conflict; preserve both the stash and worktree until resolved. Check separately for files the stash did not include. Do not use `stash pop` or drop the original merely because a copy was created.

## 3. Publish named branches

Confirm the intended remote and access with your team. With permission to publish, push each intended branch explicitly, for example:

```bash
git push -u origin my-work
git push -u origin handoff/wip
git ls-remote --heads origin my-work handoff/wip
```

Use the actual branch names from step 1. Compare the resulting remote hashes with `git rev-parse <branch>`. Do not force-push or replace someone else's branch. WIP branches require review and tests before integration. If authentication fails, configure your normal Git credentials and retry; do not paste access tokens into commands, documents, or chat. A local commit does not mean the work has been uploaded.

If `origin` uses HTTPS but your GitHub SSH key is loaded, you can push to the same repository over SSH without changing `origin`, for example `git push git@github.com:Erem32/Chess.git my-work`. First verify the repository address and `ssh -T git@github.com`; GitHub's successful SSH authentication message still exits with status 1 because it provides no shell. Push only the intended branch names.

## 4. Offline fallback

If the remote cannot be used, create a bundle containing **only the reviewed, committed branches** intended for transfer, for example:

```bash
git bundle create /secure/path/chess-handoff.bundle my-work handoff/wip
git bundle verify /secure/path/chess-handoff.bundle
git bundle list-heads /secure/path/chess-handoff.bundle
```

Verify that the listed refs and hashes match the intended commits. A bundle includes their Git history and may therefore include sensitive historical data: review its contents and transfer it through an approved secure channel. It does not include uncommitted files, stashes, ignored files, or private databases unless separately committed into included history. Give the recipient the bundle plus a separate list of anything omitted. A bundle on the source machine is not a remote backup.

## 5. Receive and resume

On the destination, preserve any existing changes first. Verify the source remote or bundle. Fetch named remote branches normally; for a bundle, inspect it with `git bundle verify /path/to/chess-handoff.bundle` and `git bundle list-heads /path/to/chess-handoff.bundle`, then fetch the selected branch into a new local name, for example:

```bash
git fetch /path/to/chess-handoff.bundle refs/heads/my-work:refs/heads/received/work
git switch received/work
```

Fetch other WIP refs under separate `received/` names; review their commits and diffs before merging. Read the checkpoint, `AGENTS.md`, and [the roadmap](IMPROVEMENT_PLAN.md); compare the checkpoint with actual Git and source. Run appropriate tests, then ask the receiving AI to use `$chess-receive-handoff` and `$continue-chess-improvements`, or read those files directly from `.agents/skills/` if its AI environment does not discover skills. Do not assume the sender's local paths, credentials, or ignored files were transferred.
