# Chess puzzles

Let a player choose a difficulty, attempt a puzzle, retry and read a short explanation. Hints are optional; there is no streak requirement.

## Small first version

Ship a handful of reviewed, single-move puzzles stored in a repository file. Each has a position, difficulty, accepted move(s), optional hint and explanation. No engine, rating, puzzle scheduler or saved attempts are needed. Verify that content is reusable and attributed where needed.

## Implementation

1. Agree the practice-board interface and a simple puzzle fixture with the shared-board owner. Build the screen and puzzle checking independently against that fixture.
2. Add a small backend check using the existing chess rules library and the authored solution. Distinguish an illegal move from a legal move that is not an accepted answer. Keep puzzle attempts separate from online games and statistics.
3. Provide difficulty selection, retry, optional hint and explanation. Keep all difficulties available regardless of experience mode.

## Done when

- A player can select a puzzle, try a move, retry and see the explanation.
- The server checks legality and the accepted answer. Every supplied puzzle has a valid position and legal solution.
- Focused tests cover correct, incorrect and illegal moves; a browser check covers a complete attempt and retry.

[Hints](guidance-hints.md) and [settings](experience-settings.md) can be integrated later. Multiple-move puzzles and saved progress are optional extensions.
