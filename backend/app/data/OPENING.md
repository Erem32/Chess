# Opening guide

`opening_guide.json` contains an Italian Game guide. A guide is an object containing:

- `title` and `introduction`: nonempty text.
- `moves`: a nonempty array of objects, each with a `move_uci` string and a nonempty `explanation`.
- `video_url`: an optional HTTP(S) URL, or `null`.

The sequence starts from the standard starting position. The backend checks each UCI move for legality and returns the resulting positions and move notation to the read-only guide. Add tests when authoring content and use only material you have permission to reuse.
