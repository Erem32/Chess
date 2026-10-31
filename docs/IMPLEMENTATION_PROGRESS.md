# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, based on `main` at `07a8cf9`. Git status and worktree list are authoritative.

Active worktrees: `improvement/reconnect` at `/tmp/chess-reconnect`, `improvement/chat-history` at `/tmp/chess-chat-history`, and `improvement/websocket-tests` (see `git worktree list` for its path). Previously integrated worktrees remain; Git history and `git worktree list` identify them.

## Priorities

- **Completed:** Removed credential-bearing frontend logs and backend token logging; cleared the WebSocket query string before Uvicorn handshake logging. Regression tests include a real Uvicorn server and failed authentication; frontend built. Proxies and other ASGI servers still require independent verification.
- **Completed:** Explicit production mode validates common unsafe settings and disables implicit seeding; development Compose still seeds explicitly. Production must set `APP_ENV=production` and real secrets. Migrations remain on startup.
- **Completed:** Row locks protect resignation and abort against concurrent moves and draw responses. Five PostgreSQL contention tests passed against a disposable database; matchmaking interactions with terminal transitions remain unverified.
- **Completed:** Login and registration forms have labels, autocomplete, pending feedback, error announcements, and registration confirmation. Agent verified a clean build and a mocked-API headless mobile smoke check; no automated frontend regression suite yet.
- **Completed:** Abort is restricted to before the first persisted move; after that the API asks players to resign. New aborts record no player result, and statistics exclude historical aborted games without altering stored records. Dashboard asks for confirmation.
- **Completed:** Registration rejects blank or oversized usernames and passwords outside bcrypt’s byte limit; `docker compose exec -T backend pytest -q app/tests/test_auth.py` passed (21 tests). Existing login behavior remains unchanged.
- **Completed:** Promotion picker supports all four pieces for both colors; three frontend tests and mocked-board browser checks passed. Real drag/two-player verification remains pending.
- **Completed:** Pinned frontend dependencies and updated vulnerable packages; clean install/build/tests passed and npm audit reported zero findings at the time of checking.
- **Completed:** Session recovery distinguishes rejected credentials from temporary failures, keeps valid tokens for retry, restores protected destinations, and removes duplicate profile requests. Five integrated frontend tests and a clean build passed; agent also ran mocked browser checks.
- **In progress:** Reconnect/resynchronization, bounded chat history, and additional WebSocket integration tests in isolated worktrees.
- **Completed:** Dashboard and history distinguish loading and errors from empty results; active-game and matchmaking startup failures are visible. Frontend build passed; browser verification is pending.
- **Pending:** Remaining gameplay polish.
- **Completed:** CI is configured for backend tests, PostgreSQL concurrency tests and migrations, plus a locked frontend install and build; GitHub-hosted execution is unverified.
- **Pending:** Frontend/browser tests, linting and incremental structure improvements.
- **Pending:** Browser accessibility and UI review, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed; backend `docker compose exec -T backend pytest -q` passed (27 tests, 86 warnings).
- A limited headless mobile authentication smoke check used mocked API responses. Full visual/accessibility review, hosting log audit, and deployment verification remain outstanding.
- Frontend dependencies were updated; clean `npm audit` reported zero findings at the time of checking. Advisory results can change.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- User selected abort only before the first move, recording no result and requiring resignation afterward. Existing aborted records were not mutated; statistics now exclude them.

## Next task

Review and integrate session recovery, then continue reconnect and resynchronization work. Verify external proxy logging separately when deployment access is available.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`
- Integrated configuration/auth/WebSocket tests: 39 passed. Integrated frontend build passed.
- Integrated migration upgrade plus full backend suite against a disposable PostgreSQL database: 60 passed (115 warnings). Clean frontend install, five tests, build and audit passed. GitHub Actions itself has not yet run.

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
