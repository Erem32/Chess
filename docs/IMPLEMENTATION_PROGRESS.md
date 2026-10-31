# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, based on `main` at `07a8cf9`. Git status and worktree list are authoritative.

Interrupted agent work was preserved on branches `improvement/reconnect` (`9ec0b96`) and `improvement/chat-history` (now includes integration commit `20c0840`). Both were pushed and integrated into `improvement/roadmap`; their WIP commits remain in history. Original worktree paths are local to the source machine; use `git worktree list` to discover actual paths. Git history and remote refs are authoritative.

## Priorities

- **Completed:** Removed credential-bearing frontend logs and backend token logging; cleared the WebSocket query string before Uvicorn handshake logging. Regression tests include a real Uvicorn server and failed authentication; frontend built. Proxies and other ASGI servers still require independent verification.
- **Completed:** Explicit production mode validates common unsafe settings and disables implicit seeding; development Compose still seeds explicitly. Production must set `APP_ENV=production` and real secrets. Migrations remain on startup.
- **Completed:** Row locks protect resignation and abort against concurrent moves and draw responses. Five PostgreSQL contention tests passed against a disposable database; matchmaking interactions with terminal transitions remain unverified.
- **Completed:** Login and registration forms have labels, autocomplete, pending feedback, error announcements, and registration confirmation. Agent verified a clean build and a mocked-API headless mobile smoke check; the two-player browser smoke now also covers registration and login.
- **Completed:** Abort is restricted to before the first persisted move; after that the API asks players to resign. New aborts record no player result, and statistics exclude historical aborted games without altering stored records. Dashboard asks for confirmation.
- **Completed:** Registration rejects blank or oversized usernames and passwords outside bcrypt’s byte limit. Login rejects null bytes in the identity or password as invalid credentials instead of returning a server error. `docker compose exec -T backend pytest -q app/tests/test_auth.py` passed (23 tests).
- **Completed:** Promotion picker supports all four pieces for both colors; three frontend tests and mocked-board browser checks passed. Real drag/two-player verification remains pending.
- **Completed:** Pinned frontend dependencies and updated vulnerable packages; clean install/build/tests passed and npm audit reported zero findings at the time of checking.
- **Completed:** Session recovery distinguishes rejected credentials from temporary failures, keeps valid tokens for retry, restores protected destinations, and removes duplicate profile requests. Five integrated frontend tests and a clean build passed; agent also ran mocked browser checks.
- **Completed:** WebSocket integration tests cover authorization, two-player broadcasts, invalid messages, persisted moves, and reconnect snapshots; six integrated WebSocket/health tests passed.
- **Completed:** Reconnect/resynchronization is integrated. Nine frontend tests and a clean build passed; a headless browser smoke test with mocked sockets verified initial failure retry and missed-move recovery. A real browser reload was tested; transient-network reconnect behavior was tested with mocked sockets.
- **Completed:** Bounded, authorized chat history and acknowledged sends are integrated. An unconfirmed send keeps its draft and warns that delivery may have succeeded. A mocked browser smoke test covered acknowledgement and disconnect, and a real two-player browser smoke covered chat and reload. Retries are not idempotent; an older-message UI remains pending.
- **Completed:** Dashboard and history distinguish loading and errors from empty results; active-game and matchmaking startup failures are visible. Frontend build passed; browser verification is pending.
- **Completed:** The server implements the automatic 75-move and fivefold repetition rules. Repetition is applied only when persisted UCI moves reconstruct the current FEN; focused tests cover draw outcomes, checkmate precedence, and inconsistent history.
- **Completed:** Players can check and claim threefold or 50-move draws on their turn, including with a declared legal move that is not played after a successful claim. The server revalidates under the game lock; PostgreSQL contention tests cover claims racing with moves. A real two-player browser smoke verified a declared-move claim and subsequent separate resignation.
- **Pending:** Remaining gameplay polish.
- **Completed:** CI is configured for backend tests, PostgreSQL concurrency tests and migrations, plus a locked frontend install and build; GitHub-hosted execution is unverified.
- **Completed:** A reusable headless two-player browser smoke test covers registration, login, matchmaking, moves from both players, chat, reload and resignation on disposable services; it is configured in CI. GitHub-hosted execution remains unverified.
- **Completed:** CI includes Ruff backend lint checks for `E4`, `E7`, `E9`, and `F` rules; the selected checks pass locally.
- **Completed:** CI includes focused Biome frontend checks for undeclared variables and unreachable code; lint, 11 frontend tests, build and audit passed locally.
- **Pending:** Broader browser/accessibility coverage, automated formatting, and incremental structure improvements.
- **Pending:** Browser accessibility and UI review, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed; backend `docker compose exec -T backend pytest -q` passed (27 tests, 86 warnings).
- A limited headless mobile authentication smoke check used mocked API responses. Full visual/accessibility review, hosting log audit, and deployment verification remain outstanding.
- Frontend dependencies were updated; clean `npm audit` reported zero findings at the time of checking. Advisory results can change.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- User selected abort only before the first move, recording no result and requiring resignation afterward. Existing aborted records were not mutated; statistics now exclude them.
- User selected a modern, understated visual direction for the later interface overhaul.
- User selected standard player-initiated claims for threefold repetition and the 50-move rule, including claims based on a declared legal move; the server must verify each claim.
- The user authorized routine pushes to project branches. GitHub HTTPS authentication failed, but the loaded SSH key works with `git@github.com:Erem32/Chess.git`; all three named branches were pushed and their hashes verified. An offline bundle at `/home/thergh/deve/Chess-handoff.bundle` is a local artifact; rebuild it after branch tips change before transferring.

## Next task

Review and integrate session recovery, then continue reconnect and resynchronization work. Verify external proxy logging separately when deployment access is available.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`
- Integrated configuration/auth/WebSocket tests: 39 passed. Integrated frontend build passed.
- Integrated migration upgrade plus full backend suite against a disposable PostgreSQL database: 82 passed (365 warnings). Clean frontend install, 11 tests, build and audit passed. The headless two-player smoke passed against disposable services. GitHub Actions completed successfully for commit `dde0267`; the claim UI and newer changes have not yet been confirmed.

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
