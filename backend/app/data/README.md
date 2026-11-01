# Practice exercise catalog

`practice_exercises.json` is a JSON array of server-owned, single-move exercises. It is empty until reviewed learning content is added. Each entry has:

- `id`: unique lowercase letters and digits separated by hyphens, up to 80 characters.
- `fen`: a valid chess position in FEN, including the side to move.
- `instruction`: nonempty text shown with the position.
- `accepted_moves`: one or more distinct, legal UCI moves from that position, including a promotion piece when required.
- `correct_feedback` and `incorrect_feedback`: optional text or `null`.

The backend validates positions and accepted moves when reading the catalog. The authenticated list endpoint returns IDs, positions and instructions, not accepted moves. An attempt supplies only a UCI move; the server loads its own position and answers. Illegal and legal-but-incorrect attempts leave the position unchanged, while a correct attempt returns the resulting FEN and optional feedback. Practice does not create or change online games.

Future lessons and puzzles should add reviewed exercises and tests together. Opening guides and other read-only content can use their own format rather than being forced into this single-move catalog.
