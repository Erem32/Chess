# Teaching examples

`teaching_examples.json` is an array of 25 authored examples. Each example has a unique lowercase hyphenated `id`, a `title`, an optional `category` for grouping, a valid starting `fen`, an `introduction`, and a nonempty `moves` array. Each move has a legal `move_uci` and an `explanation`. The backend checks each position and move and supplies resulting positions and notation to the read-only board, oriented from the starting side's perspective.

Add focused tests when changing content, and use only material you have permission to reuse. Examples do not create or change online games.
