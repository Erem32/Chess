# Implementation progress

Objective: implement the [improvement roadmap](IMPROVEMENT_PLAN.md) incrementally, following [project instructions](../AGENTS.md) and keeping server-side chess validation authoritative.

Integration branch: `improvement/roadmap`, originally based on `main` at `07a8cf9`. The historical handoff snapshot below predates later history pagination work. Git and current remote refs are authoritative; compare against current `main` before integrating.

Interrupted reconnect (`9ec0b96`) and chat (`20c0840`) work was integrated into `improvement/roadmap`; those commits remain in its history. Completed feature branch pointers were later removed locally and from the remote. Original worktree paths are local to the source machine; use `git worktree list` to discover actual paths. Git history and remote refs are authoritative.

Branch cleanup: the integrated `improvement/*` feature branches were deleted after checking their tips were ancestors of `improvement/roadmap`. Existing worktree directories were kept and detached to preserve ignored local files; missing worktree registrations were pruned. `handoff/stash-recovery`, the original stash, `mvp`, `main`, and the roadmap branch were preserved. The handoff snapshot below describes the earlier state, not current remote branches.

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
- **Completed:** Late active game updates cannot replace an already finished result; 13 frontend tests and the real two-player smoke passed. Reconnect/resynchronization is integrated. Nine frontend tests and a clean build passed; a headless browser smoke test with mocked sockets verified initial failure retry and missed-move recovery. A real browser reload and forced client-side WebSocket close/reconnect were tested; a full network outage and missed-move recovery still need real-network testing.
- **Completed:** Bounded, authorized chat history and acknowledged sends are integrated. An unconfirmed send keeps its draft and warns that delivery may have succeeded. Retries are not idempotent. Older-message navigation passed a browser test with 205 messages covering older pages, live arrivals, failed-request retry and return to latest; PostgreSQL-backed GitHub Actions passed for `1c9ebb4`.
- **Completed:** Dashboard and history distinguish loading and errors from empty results; active-game and matchmaking startup failures are visible. The dashboard restores waiting state from the server even when its browser flag is absent and ignores stale poll results after queue actions. The two-player browser smoke verifies queue recovery.
- **Completed:** The server implements the automatic 75-move and fivefold repetition rules. Repetition is applied only when persisted UCI moves reconstruct the current FEN; focused tests cover draw outcomes, checkmate precedence, and inconsistent history.
- **Completed:** Players can check and claim threefold or 50-move draws on their turn, including with a declared legal move that is not played after a successful claim. The server revalidates under the game lock; PostgreSQL contention tests cover claims racing with moves. A real two-player browser smoke verified a declared-move claim and subsequent separate resignation.
- **Completed:** Board interaction is restricted to the current player’s turn; resignation requires confirmation and is hidden after game end. The two-player browser smoke verifies cancellation, confirmation, and finished-game controls.
- **Superseded:** The previously added notation/coordinate move entry was removed at the user's request. Moves are made on the board; the server remains authoritative.
- **Completed:** Fixed click-to-move captures by removing competing piece-selection handlers. The isolated two-player Chrome smoke passed for white and black click captures, dragging, and absence of the removed field. A temporary browser component harness also verified click promotion (white capture to knight and black to rook); that harness is not a committed regression. The integrated frontend passed 16 tests, lint and build.
- **Pending:** Remaining gameplay polish.
- **Completed:** CI is configured for backend tests, PostgreSQL concurrency tests and migrations, plus a locked frontend install and build; GitHub-hosted execution is unverified.
- **Completed:** A reusable headless two-player browser smoke test covers registration, login, matchmaking, moves from both players, chat, reload and resignation on disposable services; it is configured in CI. GitHub-hosted execution remains unverified.
- **Completed:** CI includes Ruff backend lint checks for `E4`, `E7`, `E9`, and `F` rules; the selected checks pass locally.
- **Completed:** CI includes focused Biome frontend checks for undeclared variables and unreachable code; lint, 11 frontend tests, build and audit passed locally.
- **Completed:** Game WebSocket transport was extracted to `backend/app/api/websocket.py`. Database sessions now close after initial authorization and each message, rather than remaining open while sockets are idle. Focused backend tests, Ruff, and the real two-player browser smoke passed.
- **Completed:** Extracted game presentation and action panels from the game page. Frontend lint/tests/build and the two-player browser smoke passed.
- **Completed:** Shared dashboard/history game presentation helpers now live in `frontend/src/features/game/gamePresentation.js`, preserving screen-specific labels. The isolated branch passed 17 frontend tests, lint and build; browser verification of the integrated change remains pending.
- **Completed:** Extracted the game page's guarded background polling into feature-scoped modules while preserving its cadence and stale-update protection. Focused tests cover overlapping polls, live events, cleanup and failures; 18 frontend tests, lint, build and a real two-player Chrome smoke passed on the extraction branch with an isolated SQLite database.
- **Completed:** Extracted pending chat acknowledgement and timeout handling into `frontend/src/features/game/pendingChat.js`. The branch passed 21 frontend tests, lint, build, and two-player and chat-history browser smokes against isolated SQLite; Node reported an experimental mock-timers warning.
- **Completed:** The active-game endpoint uses the existing newest-game query with a database limit rather than fetching every active game. The SQLite matchmaking/game endpoint suite passed (15 tests).
- **Completed:** Game history uses bounded cursor pagination with eager-loaded players; the dashboard requests five games and the history screen can load older pages and retry errors. Backend SQLite suite: 77 passed, 7 PostgreSQL-specific tests skipped. A new browser test passed twice with an isolated SQLite backend and 22 games, checking dashboard results, complete pagination and retry after a simulated failure. It is configured in CI; its PostgreSQL-backed CI run is not yet verified.
- **Completed:** Added `CONTRIBUTING.md` with setup, checks, test-data safety, and review workflow.
- **Pending:** Broader browser/accessibility coverage, automated formatting, and remaining incremental structure improvements.
- **Completed (partial UI):** Refreshed login and registration layout in the selected modern, understated direction. Visually checked dark desktop and light mobile; no mobile horizontal overflow observed. Frontend lint/tests/build and the real two-player smoke passed.
- **Completed (focused accessibility):** Mobile game-panel buttons expose their selected state to assistive technology. Headless Chrome checks verified Enter/Space selection and no horizontal page overflow on game and history screens at 390px; the desktop two-player and history smoke tests also passed. Full screen-reader and broader accessibility audits remain pending.
- **Pending:** Full browser accessibility and UI review, other screen redesigns, operational readiness and remaining roadmap items.

## Baseline and constraints

- Starting worktree had an uncommitted roadmap and README link from the preceding review; preserved as the starting documentation increment.
- Docker services were already running. Baseline frontend `docker compose exec -T frontend npm run build` passed; backend `docker compose exec -T backend pytest -q` passed (27 tests, 86 warnings).
- A limited headless mobile authentication smoke check used mocked API responses. Full visual/accessibility review, hosting log audit, and deployment verification remain outstanding.
- Frontend dependencies were updated; clean `npm audit` reported zero findings at the time of checking. Advisory results can change.
- Existing WebSocket query-string tokens may reach proxy or hosting logs; rotation and external audit require deployment context and authorization.
- User selected abort only before the first move, recording no result and requiring resignation afterward. Existing aborted records were not mutated; statistics now exclude them.
- User selected a modern, understated visual direction for the later interface overhaul and prioritized usability, scalability and ease of adding features over further security work.
- User selected standard player-initiated claims for threefold repetition and the 50-move rule, including claims based on a declared legal move; the server must verify each claim.
- User chose to retain current WebSocket expiry behavior: token validation occurs at connection; already open sockets are not closed solely on expiry. Reconnection requires a valid token.
- The user authorized routine pushes to project branches. GitHub HTTPS authentication failed, but the loaded SSH key works with `git@github.com:Erem32/Chess.git`. An offline bundle at `/home/thergh/deve/Chess-handoff.bundle` is a local artifact and is stale; rebuild it after branch tips change before transferring.

## Next task

**In progress:** Investigate and fix the reported en passant failure, with both-color regression coverage and server-authoritative move validation. Agent owns `improvement/en-passant` in `/tmp/chess-en-passant`; inspect its worktree before resuming and review, test and integrate its work. Chat acknowledgement extraction `03fc4df` on `improvement/game-message-parsing` is integrated. The local preview uses its separate database and existing accounts; rebuild affected services after the fix without resetting the preview database.

**Priority decision:** The user now prioritizes code structure and extensibility, asks to defer large interface changes and disability-accessibility work, and wants ordinary usability bugs fixed. Retain existing useful features and server-side move validation. GitHub Actions passed for the previously integrated mobile panel changes at `36523ce`.

Backend/API tests already cover game-history authorization, bounds, and insertion between page requests. Frontend history commit `a163ddf` was merged into `improvement/roadmap`.

The Compose services were stopped during this increment. A local `npm ci` in the primary checkout failed because its existing `node_modules` directory is not writable; the integrated frontend checks passed in a clean temporary checkout. The cached backend image lacks Ruff; backend lint was not run in this increment. Seven PostgreSQL-specific tests were skipped by the SQLite run.

Afterward, review `improvement/roadmap` against the latest `main` before any integration into main. Continue gameplay polish, browser/accessibility review, and operational readiness. Verify external proxy logging separately when deployment access is available.

## Handoff snapshot (2026-10-31)

At the time of this historical snapshot, the worktrees were clean, with no merge/rebase state or untracked project files, and the refs below were pushed and verified. Completed feature branch refs have since been deleted as described above; their commits remain in the roadmap history. The unmerged recovery branch remains available.

| Branch | Commit | Notes |
|---|---|---|
| `improvement/roadmap` | `d1c23f8cbb8078c756bbde497c15782013db2efc` | Implementation snapshot; remote matched before this checkpoint-only update. |
| `improvement/reconnect` | `9ec0b96c5141d50437f849b0c39af5e30cae53e4` | Existing preserved WIP; remote matches. |
| `improvement/chat-history` | `20c084031abf624b8959a39139d93bd42a94ab4e` | Existing preserved WIP; remote matches. |
| `improvement/game-locking` | `b84240b630ced482b8b5ccb24d82b1a70b69f89a` | Clean worktree snapshot. |
| `improvement/production-config` | `835712c7d4f5a2a8e2dea92974375af6e8d8bc78` | Clean worktree snapshot. |
| `improvement/auth-ui` | `8e35de9892318c45feb08db87b3a93740bd84001` | Clean worktree snapshot. |
| `improvement/ci-workflow` | `46e4695f1d905188e673b07d6f23ece2ed4cde41` | Clean worktree snapshot. |
| `improvement/dependency-audit` | `5d29e9e63c454bbb932fbf2d7406eb7f47fe1dc3` | Clean worktree snapshot. |
| `improvement/promotion` | `689f7d07330f79ed9e07593fa61e94b27021373c` | Clean worktree snapshot. |
| `improvement/session-recovery` | `6389fded62dc11629f507a08a0c69f4516353703` | Clean worktree snapshot. |
| `improvement/websocket-tests` | `60b92edb2862339c325538379a4234d249828bbf` | Clean worktree snapshot. |
| `handoff/stash-recovery` | `1244bad8dfbc79f0634346f077200d7e7f4f118f` | WIP recovered from the original stash; see below. |

`handoff/stash-recovery` preserves an older HTTP move endpoint, move-entry UI, and WebSocket fallback/sync implementation on the stash's original base (`7a1c176`). It was committed and pushed without integration. It has not been tested; review its debug UI, polling behavior, and compatibility before using it. The original `stash@{0}` remains in the source repository as an extra local backup.

At implementation snapshot `d1c23f8`, `origin/main` was `075523532dddfb9c1735ad72889e1c0feb4aa3c6`. At that comparison point, `main` had one main-only commit while the roadmap had 33 commits not on `main`; the checkpoint-only documentation commits add no implementation changes. Inspect the graph and current source before merging or rebasing. This handoff ran `git diff --check` on the preserved changes and verified remote ref hashes; it did not run tests. Historical checks above describe earlier commits, not this snapshot.

The ignored local environment file, caches, and build output were excluded. The pre-existing offline bundle is stale and was not refreshed; use the verified remote branches, or create a new reviewed bundle if offline transfer is needed.

## Checks

- `docker compose exec -T backend pytest -q`
- `docker compose exec -T frontend npm run build`
- Integrated configuration/auth/WebSocket tests: 39 passed. Integrated frontend build passed.
- Integrated migration upgrade plus full backend suite against a disposable PostgreSQL database: 82 passed (365 warnings). Clean frontend install, 11 tests, build and audit passed. The headless two-player smoke passed against disposable services. GitHub Actions completed successfully for commit `0ada56c`, including keyboard move entry; subsequent changes are not yet confirmed.

See the README for setup and manual two-player checks. Tests against isolated worktrees must run against their own source, not the running service's mounted checkout.
