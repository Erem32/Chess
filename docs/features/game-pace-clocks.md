# Online game setup and pace

**Source:** Project Helix, §2.3 and §3.3, online games. **Status:** proposed; timed play requires a product decision and a shared game-lifecycle change.

## Outcome

Before starting a game, a player can identify the opponent and choose a clear pace, including untimed and slow play. Timed choices may be offered once the clock rules are agreed. Experience mode suggests defaults; every player can choose another pace. During play the board reports move and connection state and the authoritative result.

## Prerequisites and decisions

- Establish a shared creation and participant contract used by matchmaking, invitations and computer practice. The present queue contains only `user_id` and is not partitioned by pace, and existing games have no clock fields.
- Decide allowed time controls, increment or delay, start conditions, who may claim a timeout, and exact timeout-versus-move, resignation, abort and draw behavior. Decide handling of disconnected players and the authoritative server time source. Do not infer these policies from client timers or rewrite historical results.
- Agree queue compatibility and what happens when players select different controls; present the exact offered control before play. Untimed behavior must remain compatible with existing clients and saved games.

## Implementation guidelines

1. Separate game setup/selection from creation. Add explicit, validated game type and pace contracts; map existing records and legacy requests to untimed without altering stored history unless a reviewed migration requires it. Keep the previous flow usable during rollout.
2. For timed games, persist clock configuration and a server-observed timing anchor with the game, not a browser countdown. Define restart recovery and safe time arithmetic; the client display is only an estimate.
3. Under the same game lock and transaction, settle elapsed time and decide whether a legal move or timeout wins. Persist the resulting clock state and game result atomically; publish snapshots only after commit. Check the same condition on move, reconnect and other lifecycle transitions. Define a recoverable server-side mechanism to adjudicate expiry even if neither player connects or moves; an in-process timer alone is insufficient.
4. Add pace selection and confirmation in feature-owned setup screens. Reuse existing board/session components through a documented adapter, and keep error/status changes small and targeted.
5. Coordinate timed matching with the matchmaking owner and direct invitations with the invitation owner. Persist an agreed control once per created game; ensure no client can change it mid-game without an explicit rule.

## First independent slice and parallel work

Ship an explicit untimed setup and opponent summary after the shared creation contract is available. A clock domain and its deterministic tests can be developed separately against a fake time source; UI countdown and matching adapters can use a published snapshot contract in parallel. Do not integrate timed controls until the timeout policy is approved.

## Acceptance checks

- A player can deliberately select untimed pace and see the opponent and setting before starting; existing games remain readable and playable.
- For timed games, clocks survive refresh, reconnect and server restart. The server adjudicates an expired game even when neither player connects or moves, including recovery after restart. Server decisions, not display values, determine timeout and result.
- Isolated PostgreSQL contention tests cover move arriving at the deadline versus timeout, resignation/draw versus timeout and duplicate submissions. Controlled-clock tests cover increment, pause/start and clock drift; browser tests cover both players and connection interruption.
- No timed choice is offered until both participants have an agreed control and the backend enforces it.
