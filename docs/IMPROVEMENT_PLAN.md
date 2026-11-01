# Improvement plan

Prioritize maintainability, feature development, and everyday usability. Work in small increments with focused tests; keep the backend authoritative for chess rules and game state. See [project instructions](../AGENTS.md) and the [current checkpoint](IMPLEMENTATION_PROGRESS.md).

## Code structure and contracts

- Continue organizing frontend code around features as it changes. Keep pages focused on composing screens, and keep shared helpers limited to behavior used in more than one place.
- Simplify game-session and dashboard state where it makes a concrete change easier. Keep the displayed board and game state consistent with the server, including during reconnects and concurrent updates.
- Define and test a consistent REST and WebSocket contract for game state, errors, event ordering, and reconnect snapshots. Roll out changes compatibly with the client and server.
- Replace polling for game-ending and draw actions with a consistent update mechanism when a tested event contract is ready. Publish updates after the transaction commits and retain a recovery path for missed events.
- Document game state transitions and transaction boundaries where they help developers implement changes safely.

## Reliability and workflow

- Test missed moves, simultaneous reconnects, and recovery from real network interruptions. Expand chess-rule and game-transition coverage where gaps are found.
- Add focused tests for user-visible failures and new behavior. Run PostgreSQL tests for changes involving locking or migrations.
- Improve formatting, editor configuration, and setup documentation where they reduce friction for contributors.
- Fix observed usability problems in the existing screens as they arise.

## Completion criteria

Each increment has a clear outcome, relevant tests and documentation, a reviewed diff, and a current checkpoint. The existing two-player flow must continue to work and the backend remains the source of truth.
