# Computer practice

**Source:** Project Helix, §2.3 and §3.3, computer practice. **Status:** proposed; implementation requires approval under the project's large-feature rule.

## Outcome

A player can start a private, untimed game against a computer, choose a difficulty and request optional guidance. Experience mode may suggest defaults but never restricts these choices. The player can finish or leave the activity and return to the app.

## Prerequisites and decisions

- Agree a shared game-creation, participant and lifecycle contract first. Today `GamePlayer.user_id` must reference a real user, creation requires two users and matchmaking resumes an existing active game. Decide whether a practice game may coexist with an online game and how it appears in history and statistics; do not fabricate a user account for the computer.
- Select an opponent implementation, licensing/deployment model and understandable difficulty controls before implementation. Engine use, including Stockfish, has not been approved. A basic local opponent is a possible initial strategy, not a promise of human-like or educationally sound moves.
- Decide what “leave” means for a saved practice game, whether games persist, and which results count in statistics. Preserve existing games and abort/resignation semantics until an explicit decision changes them.
- The separate experience-settings feature may supply defaults; practice remains usable without it. Hints and explanations need a separately defined, validated source; an engine score alone is not a plain-language explanation.

## Implementation guidelines

1. Add an explicit game kind and computer participant representation through a reviewed, additive migration. Give existing records an unambiguous compatibility interpretation; test upgrade and avoid destructive backfills.
2. Isolate computer move selection behind a small service interface accepting the authoritative position, difficulty and cancellation/deadline. Keep any library or worker behind that interface; never block the request or game lock while computing.
3. Re-read and lock the game when an answer arrives. Apply it through the same backend legality and terminal-state workflow as a human move, only if game, turn and position/revision still match. Discard late or duplicate results after resignation, restart or a competing move; make retries safe.
4. Provide a practice setup and session adapter in a feature-owned frontend folder. Clearly identify the opponent and untimed pace, expose difficulty and optional help, and use authoritative snapshots/reconnect behavior. Keep content and UI independent of any particular engine.
5. Add optional hints only after the source, quality and legal-move validation are agreed. Offer a useful unavailable state when analysis fails; avoid claiming generated explanations are correct without validation.

## First independent slice and parallel work

After the shared game contract is agreed, one branch can add untimed practice with one approved simple opponent and no hints. Other developers can build the setup UI against a documented stub and evaluate opponent/hint approaches independently. Integration requires the contract owner to review shared game, player and transport files; do not run two agents changing those files independently.

## Acceptance checks

- A user starts an untimed private practice game, is told the opponent, chooses an available difficulty, and can play legal moves and leave according to the agreed lifecycle.
- Invalid and out-of-turn moves are rejected on the server; a computer move never overrides a newer position or terminal result, including after reconnect and duplicate jobs.
- Failure or timeout of the opponent produces a recoverable state. Existing human matchmaking, history and statistics remain correct.
- Test both colors, promotion and terminal positions, opponent timeout/retry and the move-versus-resign race against isolated data; add a two-session/browser regression where relevant.
