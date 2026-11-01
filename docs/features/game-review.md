# Completed-game review

Let a player review a finished game's moves and, when available, see explanations and alternatives. Review is optional.

## Small first version

Provide read-only replay of a player's finished game using the existing authorized game and moves endpoints. Show the starting position, move list and previous/next controls. Recorded moves remain useful without automated analysis or an engine.

## Implementation

1. Agree a read-only board interface with the shared-board owner. UI work can start against a fixture while access and replay behavior are checked.
2. Load the existing ordered moves and replay them from the standard starting position used by current games. Handle missing or inconsistent history clearly. If future game types can start elsewhere, add their starting-position contract before supporting their replay.
3. Keep review separate from the live game socket and never alter the saved game. Retain the existing participant access checks.
4. As a later step, add reliable explanations and alternatives only after deciding how they are produced and checked. A move list alone does not satisfy the source document's request to explain mistakes; do not label moves as mistakes without support.

## Done when

- Either participant can replay a completed game from start to finish and back; an unrelated user cannot access it.
- Replay works without analysis and handles unavailable or incomplete move data clearly.
- Focused tests cover access, move order and special moves; a browser check opens and navigates a completed game.
