# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, based on `main` at `07a8cf9`. Git status and worktree list are authoritative.

## Priorities

- **In progress:** Remove WebSocket credential logging and secure deployment configuration.
- **Pending:** Serialize competing game transitions and verify PostgreSQL concurrency.
- **Blocked on product decision:** Define abort eligibility and treatment of existing aborted-game statistics; continue independent work.
- **Pending:** Improve authentication, session recovery, promotion, reconnects, chat, and dashboard feedback.
- **Pending:** CI, reproducible dependencies, frontend and integration tests, incremental structure improvements.
- **Pending:** Browser accessibility and UI review, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed. Backend baseline is running; record its result after completion.
- No visual browser review, PostgreSQL concurrency validation, hosting log audit, or deployment verification has been performed.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- Product decision requested: limit aborts to pre-move, permit any-time abort without a result, or retain existing behavior temporarily. Do not change abort semantics or historical data without that decision.

## Next task

Remove credential-bearing logs from the WebSocket client and backend. Verify failed authentication still works and log output excludes the supplied token; build the frontend. In parallel, assess production configuration and game locking in isolated worktrees.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
