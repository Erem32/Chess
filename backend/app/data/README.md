# Practice exercise catalog

`practice_exercises.json` is a JSON array of server-owned, single-move exercises. It contains six piece lessons and three puzzles. Each entry has:

- `id`: unique lowercase letters and digits separated by hyphens, up to 80 characters.
- `kind`: `lesson` or `puzzle`; defaults to `lesson` when omitted.
- `fen`: a valid chess position in FEN, including the side to move.
- `instruction`: nonempty text shown with the position.
- `accepted_moves`: one or more distinct, legal UCI moves from that position, including a promotion piece when required.
- `correct_feedback` and `incorrect_feedback`: optional text or `null`.
- `explanation`: optional text shown when a puzzle solution is revealed.

The backend validates positions and accepted moves when reading the catalog. The authenticated list endpoint returns IDs, positions and instructions, not accepted moves. An attempt supplies only a UCI move; the server loads its own position and answers. Illegal and legal-but-incorrect attempts leave the position unchanged, while a correct attempt returns the resulting FEN and optional feedback. The authenticated puzzle solution endpoint reveals the first accepted move, its resulting position and the optional explanation. Practice does not create or change online games.

Future lessons and puzzles should add reviewed exercises and tests together. Opening guides and other read-only content can use their own format rather than being forced into this single-move catalog.
