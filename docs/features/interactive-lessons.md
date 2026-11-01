# Interactive chess lessons

Let a player choose a piece, read a short explanation, try moves, and receive feedback. Hints are optional. A lesson can be repeated or exited.

## Small first version

Add one authored piece-movement lesson, then add the other pieces as content. Store the positions, instructions and expected moves in a small file in the repository. Do not store progress or use an engine. A lesson is separate from an online game and must not affect game history or statistics.

## Implementation

1. Agree a minimal board interface with the shared-board owner; a developer can build the lesson page with a fixture in parallel.
2. Add a small backend endpoint using the existing chess rules library to validate moves for the authored position. Return a useful explanation for invalid moves and distinguish a legal move from the lesson's expected move.
3. Show the instructions, board, optional authored hint, feedback, retry and exit. Expand the checked-in content after the first lesson works.

## Done when

- The learner can make an attempt, understand the feedback, retry, finish, repeat and leave.
- Legal and illegal moves are handled correctly on the server; the lesson does not change a real game.
- Focused tests cover content, valid/invalid moves and retry; a browser check covers the lesson flow.

The lesson screen and content/validation can be developed on separate branches once the board and response shapes are agreed. [Hints](guidance-hints.md) and [settings](experience-settings.md) are optional integrations, not prerequisites.
