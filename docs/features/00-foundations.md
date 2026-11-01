# Shared preparation

This work creates stable seams for the feature branches; it is not a rewrite or a prerequisite to drafting independent feature code and tests. Agree on the contracts first, then deliver the smallest compatible slices. One integration owner coordinates shared files and migrations.

## Game creation and participants

Current code assumes two registered users: `GamePlayer.user_id` is required, `create_game_with_players` takes two users, and matchmaking returns an existing active game before creating another. Define a game-creation service independent of the queue, with explicit participant, opponent and game-configuration contracts. Decide how a computer participant is represented, whether a user can have more than one active game, and how practice games affect history and statistics. Do not use a shared fake account or change existing game results by default.

Deliver the contract and compatibility tests first; add only the fields and paths required by the first approved game feature. Migrations must be additive, specify how existing games are interpreted, and be tested against a copy of existing data. Audit duplicate participant/color and move-number records before considering uniqueness constraints; any data correction needs separate approval. Keep moves and lifecycle transitions server validated and transactional. Preserve current HTTP/socket clients during migration.

## Board and game-session boundary

Separate reusable board rendering and interaction from live-game networking so a lesson, puzzle, opening or replay can supply a position, orientation, interaction policy and move callback. A practice or replay board is not a live game: allow feature-specific move constraints without giving the client authority over a real game's result. Preserve clicking, dragging, promotion and the existing live-game flow. Coordinate `ChessBoard.jsx`, `GamePage.jsx`, routing and global styles with a single integration owner.

Existing snapshot/repetition logic assumes a standard initial position and compares stored FENs. Specify starting-position and replay semantics before supporting custom live-game positions; do not silently reuse a normal game as a puzzle. Keep existing games readable.

## Independent activity and content contracts

Agree on a minimal versioned content format for lessons, puzzles and opening guides: stable IDs, position/move representation, authored explanation/hint, difficulty metadata and content provenance/license. Model attempts and optional progress separately from games and user statistics. Features may prototype with isolated fixtures and their own modules; a shared content engine is not required before the first lesson. Validate published positions and moves; define solution ownership, content updates and offline/unavailable-content behavior.

## Preferences and events

Define a small preference API and feature-consumption boundary in [experience settings](experience-settings.md); keep defaults, user overrides and any automatic recommendation separate. Define additive, documented game events/snapshots with ordering and a recovery path before changing live game lifecycles; current moves use WebSocket messages while HTTP actions are reflected by polling. Avoid infrastructure changes unrelated to the feature.

## Integration gates

- Existing migrations upgrade without resetting a database; no historical records are rewritten without review and authorization.
- Existing two-player matchmaking, legal moves, promotion, reconnect, draw and resignation behavior remain covered by backend, PostgreSQL contention and browser smoke tests.
- Test each new boundary with one real integration path as well as focused domain tests. Define feature-specific ownership and merge migrations in dependency order.
- Content, engine/provider, clock rules, personalisation thresholds and social policies remain explicit decisions in their feature briefs. Implementing major new capabilities requires product approval under [AGENTS.md](../../AGENTS.md).
