# Game pace and clocks

**Goal:** Let players choose an untimed or timed game and see the selected pace. Keep untimed play as the simple starting point; timed play is a later increment, not a prerequisite for other features.

## Small first version

Make the existing untimed setting clear in game setup. Once the team agrees on one simple time control and timeout rules, add that option; more presets and increments can wait. Players must agree on the same pace before a timed game begins.

## Implementation

1. Use the existing game-creation flow for untimed games. Coordinate the pace field with [game setup](game-setup-board.md) and [invitations](friend-invitations.md) when timed play is added.
2. For timed games, persist the remaining times and the server time at which the current turn began. The server checks and updates the clock under the game lock when a move or game-ending action happens; the browser countdown is only a display.
3. Use a simple server-side periodic check for expired games and check again after a server restart. A game must eventually time out even if neither player reconnects. Existing games remain untimed.
4. Before implementation, agree what happens at the deadline, on disconnection, and when a timeout cannot legally result in a win. Keep the first version to one control; no new worker infrastructure is needed for a small project.

## Dependencies and checks

- Untimed setup can proceed independently. The timed slice needs game-model and creation changes plus an agreed timeout result; it must not be offered until enforced by the backend.
- Test both clocks, deadline-versus-move and game-ending races, server restart, and both players disconnected. Use disposable PostgreSQL for locking tests; existing untimed games must continue working.
