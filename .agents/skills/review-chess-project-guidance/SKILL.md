---
name: review-chess-project-guidance
description: Audit and update Chess repository documentation, feature plans, checkpoints, and agent skills against the current code and Git state. Use for a project-wide guidance or stale-documentation cleanup, rather than routine documentation updates for a single change.
---

# Review Chess project guidance

Read `AGENTS.md` and inspect the current branch, status, worktrees, recent commits, and relevant remote refs before editing. Preserve uncommitted and unmerged work. Determine the actual integration baseline and compare it with the files being reviewed; do not assume a feature branch has been merged.

Review the README, project structure, feature references and plans, implementation checkpoint, handoff guidance, and repository skills under `.agents/skills/`. Verify material claims against the actual code, configuration, content, tests and Git history. Distinguish implemented behavior, remaining work, unverified claims and decisions requiring the owner. Do not infer new features or invent evaluation results.

Update the guidance to match the evidence and current user priorities. Remove obsolete prerequisites, completed-work narratives and unnecessary duplication; retain useful feature descriptions, operational instructions, explicit product decisions, and safe handoff and recovery procedures. Keep future plans actionable and proportionate to this university project. Preserve user changes and do not discard work while cleaning documentation.

Check links, documented commands and referenced files; validate changed skills with the available skill validator. Run checks appropriate to any code changes, and report the checks actually run and any limitations. Review the diff and follow `AGENTS.md` and the user's authorization for commits and pushes. Use `$maintain-chess-docs` for documentation maintenance accompanying ordinary implementation work.
