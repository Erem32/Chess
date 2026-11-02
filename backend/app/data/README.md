# Practice exercise catalog

`practice_exercises.json` is a JSON array of six piece lessons and 103 puzzles. Entries contain:

- `id`: unique letters and digits separated by hyphens, up to 80 characters. Lichess IDs are case-sensitive.
- `kind`: `lesson` or `puzzle`; defaults to `lesson` when omitted.
- `fen`: a valid chess position in FEN, including the side to move.
- `instruction`: nonempty text shown with the position.
- `accepted_moves`: one or more distinct, legal UCI moves from that position, including a promotion piece when required.
- `solution_moves`: optional UCI sequence for a puzzle, alternating player and opponent moves and ending with the player. The first item must be the sole `accepted_moves` entry. Without a sequence, a puzzle is single-move and accepts any listed move.
- `correct_feedback`, `incorrect_feedback` and `explanation`: optional text.
- `rating` and `source_url`: optional puzzle difficulty and source metadata.

The catalog includes 100 Lichess puzzles from the [archived sample](https://github.com/mcognetta/lichess-combined-puzzle-game-db/blob/main/combined_puzzle_db_first_100.ndjson); the underlying [Lichess database](https://database.lichess.org/#puzzles) is CC0. The source FEN is from before the opponent's last move, so the first source move was applied when importing. The remaining moves form `solution_moves`. The original puzzle IDs and sample ratings are retained; no live Lichess request is needed.

The backend validates positions, accepted moves, and each complete puzzle line when reading the catalog. `GET /api/v1/practice/exercises` optionally filters by `kind` and does not expose answers. The existing `/exercises/{id}/attempt` and `/exercises/{id}/solution` endpoints validate or reveal a single initial move and remain available to existing clients.

The puzzle screen uses `POST /api/v1/practice/puzzles/{id}/attempt`, `/hint`, and `/solution`. Each receives `{"moves": [...]}`, containing only the player's previously accepted UCI moves; an attempt also supplies `move_uci`. The server verifies that history against its own line, reconstructs the position, and returns the next position and an opponent move when applicable. A hint reveals the source square and piece of the next move; the solution endpoint reveals the rest of the line in SAN. The server rejects invalid or completed histories. Practice does not create or change online games.
