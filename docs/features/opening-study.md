# Opening guide

The opening study page lists 20 opening guides. Each has an annotated example line of five to seven full moves, a read-only board and previous/next controls. A video link is optional; the written guides stand alone.

The backend validates and serves the checked-in catalog. Reaching the final position marks a guide completed, and users can repeat it. Completion is stored in browser local storage under the signed-in user ID, without backend synchronization; clearing site data removes it. These activities do not create or change games.

Opening names and representative move sequences were checked against the [Lichess chess openings dataset](https://github.com/lichess-org/chess-openings), released under CC0. The explanations in this project were written for the guides.

See the [opening content format](../../backend/app/data/OPENING.md), `test_learning_content.py`, and the `test:e2e:opening` browser check.
