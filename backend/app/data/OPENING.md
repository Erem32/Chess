# Opening guide

`opening_catalog.json` contains the guides shown on the Opening study page. Each guide is an object containing:

- `id`: a unique, stable lowercase identifier using letters, digits and hyphens. Changing an ID loses its browser-local completion status.
- `line`: a nonempty description of the illustrated variation.
- `title` and `introduction`: nonempty text.
- `ideas`: a nonempty list of ideas for the learner.
- `moves`: a nonempty array of objects, each with a `move_uci` string and a nonempty `explanation`.
- `video_url`: an optional HTTP(S) URL, or `null`.

The sequence starts from the standard starting position. The backend validates every UCI move, rejects duplicate IDs and returns resulting positions and move notation from `GET /api/v1/opening/catalog`. Add tests when authoring content and use only material you have permission to reuse.

The original `opening_guide.json` and `GET /api/v1/opening` remain available for existing clients. Completion is stored by the frontend in local storage, not in either content file or the backend.
