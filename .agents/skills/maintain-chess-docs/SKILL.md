---
name: maintain-chess-docs
description: Keep documentation for the Erem32/Chess online chess project accurate as the code changes. Use when working on this repository's features, API, WebSockets, configuration, dependencies, setup, tests, or folder structure, or when asked to review or update its README and architecture guide.
---

# Maintain Chess documentation

1. Confirm the working repository is Erem32/Chess and read its applicable AGENTS.md instructions. Inspect the current branch and relevant changes, including staged and unstaged changes when available. If comparing against a base branch, determine the actual base instead of assuming a branch name.
2. Read the changed code and its surrounding behavior. Check the affected documentation against implementation, configuration, migrations, and tests; treat planning notes and old documentation as claims to verify, not proof that a feature works.
3. Update only what the change affects:
   - `README.md` for user-visible features, startup, configuration, endpoints, WebSocket messages, testing, and known limitations.
   - `docs/PROJECT_STRUCTURE.md` for folders, module responsibilities, and the authentication, matchmaking, and game flows.
   - `AGENTS.md`, `rules.md`, and `plan.md` only when their instructions or factual claims become inaccurate.
4. Preserve the existing language and useful project details. Distinguish implemented code from plans and unverified behavior. Do not invent commands, endpoints, examples, or test results. Do not copy real secrets or private credentials into documentation.
5. Check changed Markdown links and compare documented commands and API/WebSocket contracts with the source. Run relevant checks when practical; report checks that could not be run. Explain which documentation changed, or state that no documentation update was necessary.

Include documentation changes in the same work as the code change. Do not create commits, branches, or pull requests unless the user's task authorizes them.
