# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, based on `main` at `07a8cf9`. Git status and worktree list are authoritative.

Active worktrees: `improvement/promotion` at `/tmp/chess-promotion`, `improvement/session-recovery` at `/tmp/chess-session-recovery`, and `improvement/dependency-audit` at `/tmp/chess-dependency-audit`. Completed integrated worktrees: `improvement/production-config`, `improvement/game-locking`, `improvement/auth-ui`, and `improvement/ci-workflow`; retain until reviewed for cleanup.

## Priorities

- **Completed:** Removed credential-bearing WebSocket application logs; failed authentication regression test passed and frontend built.
- **Completed:** Explicit production mode validates common unsafe settings and disables implicit seeding; development Compose still seeds explicitly. Production must set `APP_ENV=production` and real secrets. Migrations remain on startup.
- **Completed:** Row locks protect resignation and abort against concurrent moves and draw responses. Five PostgreSQL contention tests passed against a disposable database; matchmaking interactions with terminal transitions remain unverified.
- **Completed:** Login and registration forms have labels, autocomplete, pending feedback, error announcements, and registration confirmation. Agent verified a clean build and a mocked-API headless mobile smoke check; no automated frontend regression suite yet.
- **Completed:** Abort is restricted to before the first persisted move; after that the API asks players to resign. New aborts record no player result, and statistics exclude historical aborted games without altering stored records. Dashboard asks for confirmation.
- **Completed:** Registration rejects blank or oversized usernames and passwords outside bcrypt’s byte limit; `docker compose exec -T backend pytest -q app/tests/test_auth.py` passed (21 tests). Existing login behavior remains unchanged.
- **In progress:** Session recovery, promotion, and frontend dependency audit in isolated worktrees.
- **Pending:** Reconnects, chat, and dashboard feedback.
- **Completed:** CI is configured for backend tests, PostgreSQL concurrency tests and migrations, plus a locked frontend install and build; GitHub-hosted execution is unverified.
- **Pending:** Frontend/browser tests, linting and incremental structure improvements.
- **Pending:** Browser accessibility and UI review, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed; backend `docker compose exec -T backend pytest -q` passed (27 tests, 86 warnings).
- A limited headless mobile authentication smoke check used mocked API responses. Full visual/accessibility review, hosting log audit, and deployment verification remain outstanding.
- Clean frontend installation reported six npm audit findings (one moderate, five high); investigate without indiscriminate upgrades.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- User selected abort only before the first move, recording no result and requiring resignation afterward. Existing aborted records were not mutated; statistics now exclude them.

## Next task

Remove WebSocket query strings from Uvicorn handshake logs and test a real server; review and integrate session recovery, promotion and dependency worktrees as they complete. Verify external proxy logging separately when deployment access is available.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`
- Integrated configuration/auth/WebSocket tests: 39 passed. Integrated frontend build passed.
- Integrated migration upgrade plus full backend suite against a disposable PostgreSQL database: 60 passed (115 warnings). Integrated frontend build passed. GitHub Actions itself has not yet run.

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
