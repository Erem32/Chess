# Puzzles

## Outcome

Provide a handful of authored puzzles. A player can attempt a move, retry or reveal the prepared solution and its explanation. Practice is untimed and has no opponent.

## Implementation

- Keep a few reviewed puzzle positions, accepted moves, solutions and short explanations in repository files. Start with single-move puzzles and check that the content and legal solutions are correct.
- Reuse the practice board and backend move checking described in [shared preparation](00-foundations.md). The current board filters illegal moves before `onMove`, so the practice adapter must also report rejected attempts for feedback without changing live-game behavior. Distinguish an illegal move from a legal but incorrect answer; neither should change an online game or player statistics.
- Provide a simple selection, retry and reveal flow. Legal-move guidance follows [settings](experience-settings.md); prepared explanations are available without a separate hints service or engine.

## Dependencies and checks

The puzzle content and screen can be developed separately against example positions and responses; the shared board and settings interfaces are needed for integration. Test correct, incorrect and illegal attempts, retry and reveal, content validity, and one complete browser journey.
