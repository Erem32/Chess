# Repository and product improvement plan

This is a proposed roadmap, not a list of implemented changes. It is based on a source review of the current MVP. Priorities reflect the existing two-player chess scope; larger product features require a separate decision. Server-side chess validation remains authoritative.

## Starting point

The project already has a useful FastAPI route/service/repository split, persisted games and moves, database-backed matchmaking, migrations, a React interface, Docker development and preview environments, and backend tests. Preserve these foundations and improve them in small, reviewable changes. Avoid a wholesale rewrite or moving files solely to match a preferred architecture.

The review did not include a visual browser or accessibility audit, a two-player manual playthrough, load testing, or a production deployment review. UI recommendations below follow from the source and need validation in the browser at desktop and mobile sizes.

## Priority 0: protect credentials and game outcomes

1. **Stop logging WebSocket credentials.** [Backend WebSocket authentication](../backend/app/main.py) prints the token on failed authentication, and the [frontend socket client](../frontend/src/api/websocket.js) logs a URL containing it. Remove both; audit server, proxy, hosting, and browser logging for query-string exposure. Treat previously logged tokens as potentially exposed and decide whether to rotate the signing secret or invalidate sessions based on actual exposure. Add a regression check that secrets do not appear in logs. Longer term, choose a WebSocket authentication design with a short-lived, single-use ticket or another well-reviewed approach; account for browser constraints and redact URLs even during transition.
2. **Make deployment configuration safe by default.** [Settings](../backend/app/core/config.py) contain a development signing key and enable seed users by default; [startup](../backend/Dockerfile) runs seeding and migrations. Introduce explicit environments and fail fast for insecure production configuration, disable seeding by default outside local development, document secret rotation and separate migration execution from application startup where the deployment supports it. Keep a frictionless local setup.
3. **Serialize all competing game state changes.** Moves and draw actions take a game row lock, whereas [resignation and abort](../backend/app/services/game_service.py) do not. Use a consistent transaction and locking strategy for every state transition, including interactions with matchmaking; test simultaneous move/resign, draw/resign and abort/move against PostgreSQL. Ensure a finished result cannot be overwritten. The in-process matchmaking lock and PostgreSQL advisory lock already exist; preserve and test the cross-process behavior rather than replacing them blindly.
4. **Agree on abort semantics.** The dashboard can abort active games and the backend records each player's result as a draw, so [statistics](../backend/app/services/user_service.py) count an aborted game as a draw. Decide when an abort is allowed and what each player sees, distinguish it from a draw in history and stats, and correct existing data only after reviewing a migration/backfill. Confirm consequential actions in the UI and explain their effect.

**Done when:** credentials are absent from application logs; unsafe production configuration is rejected; concurrency tests demonstrate one consistent final outcome; and aborts, history and statistics follow the chosen rules.

## Priority 1: reliable core play and quick user-facing fixes

### Login, registration, and session

- Add visible, associated labels, appropriate `autocomplete` values, required-field feedback and clear inline errors to [login](../frontend/src/pages/LoginPage.jsx) and [registration](../frontend/src/pages/RegisterPage.jsx). Add pending/disabled states to prevent duplicate submissions, clear success feedback after registration, and sensible keyboard focus and error announcements.
- Define and enforce matching server/client constraints for username and password, including bcrypt's input limits; do not rely on browser validation. Decide case and whitespace rules for identifiers and handle conflicts consistently. Add rate limiting for authentication before public exposure.
- Centralize session initialization and login in [AuthContext](../frontend/src/context/AuthContext.jsx): the login page currently fetches the profile and the provider fetches it again. Distinguish an expired/invalid session from a temporary network or server failure; currently any profile-load error clears the token. Preserve a requested protected destination after successful login where appropriate.
- Review the browser token storage and lifetime against the intended deployment and threat model. If changing to cookies, explicitly address CSRF, secure cookie settings, CORS, and WebSocket authentication together. Do not promise that a storage change alone prevents XSS.

### Chess and real-time experience

- Offer a promotion picker for queen, rook, bishop and knight: [the board currently sends queen promotion automatically](../frontend/src/components/ChessBoard.jsx). Verify both colors, click and drag interaction, and server rejection of invalid moves.
- Specify chess termination rules, including claimable versus automatic repetition and move-count draws. [The current move function](../backend/app/services/chess_service.py) checks checkmate, stalemate and insufficient material using a board reconstructed from FEN; repetition requires position history, so design and test it using persisted moves or equivalent history. Cover castling, en passant, promotion and terminal states as well.
- Fix reconnection and resynchronization: the [game page](../frontend/src/pages/GamePage.jsx) retries after an opened socket closes, but not after a connection fails before opening. Use bounded exponential backoff with jitter, distinguish authorization failures from transient failures, expose retry state, clean up on navigation, and reload authoritative game and move state on reconnect. Test missed moves, stale responses, duplicate events and both players reconnecting. Clarify token expiry behavior for existing sockets.
- Unify updates after moves, resignation, draws and aborts. HTTP game actions currently rely on the game's two-second polling for the other player to see changes. Define a single event/snapshot contract, publish only after a committed transaction, and retain a recovery path for missed events.
- Restore persisted chat on reload through an authorized, bounded history API, and preserve unsent text on a failed send. Set and enforce message length limits on both sides. Decide pagination and retention before chat volume grows.
- Improve dashboard loading, errors, and empty states: some requests silently fail, initial zero statistics can look real before loading, and matchmaking state is split between session storage and server state. Make the server the source of truth, visibly distinguish loading/error/empty states, and make resume, leave queue and game-ending actions unambiguous.

**Done when:** a player can register, sign in, queue, play including underpromotion, disconnect/reconnect, finish a game, and see correct history and statistics; the same flow works for both players and reports recoverable failures clearly.

## Priority 2: make changes safer and cheaper

### Quality gates and repeatable development

- Add CI for backend tests, frontend clean install/build, lint/format checks, and migration validation. Use `npm ci` with the committed lockfile in automated and container builds; replace `latest` declarations with intentional version ranges or pins and introduce a routine dependency update and vulnerability review. Keep Python dependencies reproducible and update them deliberately.
- Add frontend component tests for authentication, board interaction, session errors and connection states. Add a small end-to-end browser suite covering two independent sessions, matchmaking, moves, refresh/reconnect, game ending and history. Keep a short manual responsive/accessibility checklist for behavior automation does not cover.
- Keep fast SQLite tests, but add PostgreSQL integration tests for locking, concurrent matchmaking and game transitions, constraints and migrations. The current test fixtures create tables directly and do not exercise Alembic or PostgreSQL locking. Add real WebSocket authorization, malformed message, disconnect and broadcast tests; use isolated test data and avoid touching development databases.
- Add consistent Python and JavaScript linting/formatting, editor settings and a short contributor guide with prerequisites, setup, commands, database reset guidance, and pull-request expectations. Add typing incrementally where it clarifies contracts; TypeScript is an optional staged decision, not a prerequisite for the redesign.
- Make the default development workflow one or two documented commands. Keep `.env.example` current, document local versus preview databases, and provide safe seed/reset instructions without exposing secrets.

### Structure and contracts

- Retain the existing backend layers. Extract the WebSocket endpoint and message validation from [main.py](../backend/app/main.py) into a transport module; keep chess and lifecycle rules in services, persistence in repositories, and application setup in `main.py`. Consolidate duplicate game-access and error handling where useful, without creating a generic framework.
- Introduce feature-oriented frontend folders incrementally as work touches them. A practical destination is `features/auth`, `features/matchmaking`, and `features/game` for each feature's components, hooks, API calls and tests, plus `shared/` for truly reused UI and utilities and `app/` for routing/providers. Keep pages as composition points. Move related files together with their imports and tests; avoid a disruptive all-at-once rename.
- Split the 560-line game page into a game session/reconnect hook, board area, game actions and side panels; split dashboard data and matchmaking state from its presentation. Centralize response formatting that is duplicated between pages. Keep a single source of truth for game state rather than maintaining independently updated FEN and game fields without a reconciliation rule.
- Replace the single large [CSS file](../frontend/src/styles/index.css) gradually with tokens, shared primitives and feature/component styles. Define colors, spacing, typography, focus states and responsive breakpoints for both themes before expanding screens. Adopt a component library only if it solves a demonstrated need.
- Define versioned, validated REST and WebSocket message schemas, including errors, event ordering/version and reconnect snapshots. Prefer one canonical shape over the frontend's multiple fallback shapes. Document compatibility and roll out changes with both client and server in mind. Add contract tests.
- Document game state transitions, database ownership and transaction boundaries, including how client hints relate to server authority. Use small architecture decision records only for consequential tradeoffs.

**Done when:** a clean checkout runs the documented workflow; CI exercises the essential paths; a new feature can be added within a clear boundary; and API or schema changes have tests and migration instructions.

## Priority 3: product polish and operational readiness

- Run a focused UI review on desktop and narrow mobile viewports for login, dashboard, board, chat and history. Establish visual hierarchy, consistent wording and spacing, accessible contrast, focus indicators, keyboard navigation, touch targets, error announcements and screen-reader labels. Test light and dark themes and both board orientations. Prioritize actual observed problems rather than assuming the current layout is broken.
- Agree on a small design system and screen flows before a visual overhaul: product identity, type, color tokens, reusable form/button/dialog components, and loading, empty, success and error states. Prototype the game screen around board visibility and move feedback; validate with real users before applying the system everywhere.
- Add structured, secret-safe logs, request correlation, clear readiness/liveness behavior, error reporting, database backup and restore procedures, and a documented release/rollback process appropriate to the actual hosting environment. Verify how hosting handles access logs and migrations.
- The [WebSocket connection manager](../backend/app/services/websocket_manager.py) is process-local. Keep a single application instance until a multi-instance design is needed; then introduce shared event delivery, test ordering and reconnect behavior across instances, and account for database and connection capacity. Avoid adding infrastructure prematurely.
- For growing datasets, paginate game and chat history, review database indexes and query counts, and measure performance before tuning. Establish UTC timestamp handling consistently and test display in different time zones.

**Done when:** main journeys are usable with keyboard and touch, monitored failures can be diagnosed without exposing credentials, backup restoration and rollback are practiced, and scaling assumptions are recorded.

## Suggested first delivery sequence

1. Remove token logging and audit deployment logs; establish safe configuration defaults.
2. Add regression tests and fix transaction races and aborted-game statistics; decide abort rules.
3. Improve login and registration feedback and recoverable session handling.
4. Fix underpromotion and reconnect/resync; add two-player WebSocket and PostgreSQL tests.
5. Add CI and reproducible installs, then split the game page and socket transport around tested behavior.
6. Agree on the visual direction, accessibility baseline and component tokens; redesign one screen at a time.
7. Add remaining chess-draw rules and chat restoration, then improve deployment and operations as the release target requires.

These steps can overlap where ownership is clear, but security and game correctness should not wait for the UI overhaul. Time estimates and sequencing beyond this depend on the team, release target, and which new features are approved.
