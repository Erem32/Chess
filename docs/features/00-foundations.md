# Shared preparation

Keep preparation limited to what the selected features need. The existing React/FastAPI application, chess libraries and PostgreSQL setup are the starting point; no new infrastructure or broad rewrite is necessary.

## Reuse the board

Practice screens can use the board's optional invalid-attempt callback to request backend feedback. Keep practice interaction separate from the live game.

## Practice content and validation

Keep reviewed lesson, puzzle, opening and example positions in repository files. The practice catalog format is documented in [practice data](../../backend/app/data/README.md); its catalog starts empty. Interactive attempts use backend chess validation and distinguish an illegal move from a legal move that does not solve the exercise. Author positions compatible with the validation rules and test each supplied sequence.

Prepared activities are separate from online games and must not alter their state, history or statistics. Read-only examples need no live socket. Existing game replay and repetition logic assumes a standard starting position; do not change that contract merely to display a prepared position.

## Integration

Coordinate shared board props, app navigation and any practice endpoint with one owner. Feature pages and content can be built in parallel against example fixtures. Merge the shared board contract first, then test each feature separately and run the existing two-player smoke test when shared game behavior changes. Use disposable test data.
