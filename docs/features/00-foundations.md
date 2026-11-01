# Shared preparation

Keep preparation limited to what the selected features need. The existing React/FastAPI application, chess libraries and PostgreSQL setup are the starting point; no new infrastructure or broad rewrite is necessary.

## Reuse the board

`ChessBoard` already accepts a FEN, player color and move callback. Make the smallest changes needed to display prepared positions, support read-only examples, and turn legal-move markers on or off. Preserve click, drag and promotion in online games.

The current board filters illegal attempts before calling `onMove`. Lessons and puzzles therefore need a practice-only attempt/rejection callback or adapter so they can show feedback. Keep this behavior separate from the live-game interaction.

## Practice content and validation

Keep a small set of reviewed lesson, puzzle, opening and example positions in repository files. Agree a simple fixture shape between screen and content owners. Reuse `python-chess` and the existing backend move-validation logic for interactive attempts; the server remains authoritative. Distinguish an illegal move from a legal move that does not solve the exercise. Author positions compatible with the validation rules and test each supplied sequence.

Prepared activities are separate from online games and must not alter their state, history or statistics. Read-only examples need no live socket. Existing game replay and repetition logic assumes a standard starting position; do not change that contract merely to display a prepared position.

## Integration

Coordinate shared board props, app navigation and any practice endpoint with one owner. Feature pages and content can be built in parallel against example fixtures. Merge the shared board contract first, then test each feature separately and run the existing two-player smoke test when shared game behavior changes. Use disposable test data.
