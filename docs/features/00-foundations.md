# Minimal preparation

Do only the preparation needed by the next feature. The current React/FastAPI application and database are sufficient for a university project; do not introduce a platform, job queue, new infrastructure or a large redesign.

## Board for learning and review

The existing `ChessBoard` already receives a FEN and move callback. Make the smallest changes needed to use it for a read-only review or a practice position, while keeping live-game networking in the game page. Preserve click, drag and promotion. Lessons, puzzles, opening guides and replay can start from small files in the repository; they do not need a shared content service or database.

Keep backend validation authoritative for chess moves. A lesson or puzzle must not modify an online game or its statistics. Existing live-game snapshot and repetition code assumes a standard starting position; keep practice positions separate rather than changing existing games.

## Private practice and invitations

The existing game creation assumes two registered users, and matchmaking resumes an active game. For private computer practice, use a separate backend endpoint that validates and replays the supplied moves; keep this unsaved activity out of the live-game model and statistics. Reuse existing game creation for two human players where appropriate. Do not fabricate a user or redesign the game model just to add practice.

For invitations, use a simple authenticated direct challenge and keep the existing matchmaking path. Agree what happens when either user already has an active game. Add only the data and migrations needed for the implemented slice, preserving existing records.

## Coordination

- Agree a few example positions, move responses and settings fields before parallel work. Keep changes in feature-specific files; coordinate shared board, routes and migrations with one integrator.
- Keep existing online games working. Use focused tests and the existing two-player smoke test for shared-game changes; use disposable data.
- Product approval is still required before implementing major new capabilities under [project instructions](../../AGENTS.md). This plan does not authorize changing historical data.
