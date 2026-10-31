# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, based on `main` at `07a8cf9`. Parallel worktrees: `improvement/production-config` at `/home/thergh/deve/Chess-production-config`, `improvement/game-locking` at `/home/thergh/deve/Chess-game-locking`, and `improvement/auth-ui` at `/tmp/chess-auth-ui`. Git status and worktree list are authoritative.

## Priorities

- **Completed:** Removed credential-bearing WebSocket application logs; failed authentication regression test passed and frontend built.
- **Completed:** Explicit production mode validates common unsafe settings and disables implicit seeding; development Compose still seeds explicitly. Production must set `APP_ENV=production` and real secrets. Migrations remain on startup.
- **In progress:** Serialize competing game transitions and verify PostgreSQL concurrency in its isolated worktree.
- **Completed:** Login and registration forms have labels, autocomplete, pending feedback, error announcements, and registration confirmation. Agent verified a clean build and a mocked-API headless mobile smoke check; no automated frontend regression suite yet.
- **Pending:** Enforce user-selected abort only before the first move, with no result; require resignation afterward. Review legacy aborted-game statistics separately before any historical data correction.
- **Completed:** Registration rejects blank or oversized usernames and passwords outside bcrypt’s byte limit; `docker compose exec -T backend pytest -q app/tests/test_auth.py` passed (21 tests). Existing login behavior remains unchanged.
- **Pending:** Improve session recovery, promotion, reconnects, chat, and dashboard feedback.
- **Pending:** CI, reproducible dependencies, frontend and integration tests, incremental structure improvements.
- **Pending:** Browser accessibility and UI review, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed; backend `docker compose exec -T backend pytest -q` passed (27 tests, 86 warnings).
- A limited headless mobile authentication smoke check used mocked API responses. Full visual/accessibility review, integrated PostgreSQL concurrency validation, hosting log audit, and deployment verification remain outstanding.
- Clean frontend installation reported six npm audit findings (one moderate, five high); investigate without indiscriminate upgrades.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- User selected abort only before the first move, recording no result and requiring resignation afterward. Do not change historical data without separate review and authorization.

## Next task

Review and integrate the game locking increment, then implement the selected pre-move abort rule and tests. Review the CI worktree when ready. Verify external proxy logging separately when deployment access is available.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`
- Integrated configuration/auth/WebSocket tests: 39 passed. Integrated frontend build passed.

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
