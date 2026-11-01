# Computer practice

**Goal:** Let a player practise against a simple computer opponent without a clock. This is separate from online games and player statistics.

## Small first version

Start an untimed practice session that lasts until the player leaves or refreshes. The player chooses a color and can ask for a legal-move hint. A basic opponent can choose a random legal move; label it clearly as simple rather than promising a particular chess strength. The source also asks for selectable difficulty: add a second, slightly different simple move-selection option only if its behavior can be explained and tested. Do not add an engine just for this slice.

## Implementation

1. Reuse the board where practical. Keep practice state and controls separate from matchmaking and live games. Do not create a fake computer user or change existing game records.
2. Add a small backend practice endpoint that receives the moves so far, replays and validates them from the starting position using `python-chess`, and returns a legal computer move and updated position. The server derives the position rather than trusting a client-supplied FEN. This unsaved private activity carries its move list in the browser; reject illegal sequences and never treat it as an online game. A practice session can be restarted if interrupted.
3. Show the computer opponent, an untimed setting, and a restart/leave action. A basic hint may show a legal move without claiming it is a good strategic choice.

## Dependencies and checks

- Coordinate board reuse with [shared preparation](00-foundations.md). Practice can be developed on its own branch without invitations, clocks, settings or a rating system.
- Decide whether practice should later be saved or appear in history before changing the database. A stronger engine, richer difficulty controls or explanatory hints need a separate decision and implementation.
- Test legal and illegal moves, both colors, end positions, promotion and restarting. Verify that practice does not change an online game or player statistics.
