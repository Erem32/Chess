# Puzzles

The catalog contains three introductory puzzles and 100 positions from the [Lichess open puzzle database](https://database.lichess.org/#puzzles), which Lichess releases under CC0. The imported selection comes from the [first 100 puzzles in this archived sample](https://github.com/mcognetta/lichess-combined-puzzle-game-db/blob/main/combined_puzzle_db_first_100.ndjson). Each puzzle links to its original Lichess page after solving or revealing it. The displayed Lichess rating describes the puzzle at the time of the sample; it is not an estimate of the player's rating.

Choose a puzzle, or start the next unsolved one. The player can ask for the piece and square to consider, retry, or reveal the remaining solution. For multi-move positions, the server validates each player move and plays the stored opponent response. Legal alternatives to the stored line are marked incorrect, except that any checkmate is accepted for imported positions. There is no engine analysis of alternative winning moves.

The counter counts unique puzzles completed by the player, including with hints. Revealing a solution does not count as a solve; retry and complete the line to count it. Progress is stored under the signed-in user ID in the current browser's local storage; it does not sync across browsers or devices and is lost when site data is cleared. Practice does not change online games or game statistics.

See the [practice data format](../../backend/app/data/README.md), `test_puzzles.py` and `npm run test:e2e:puzzles` for validation and browser coverage.
