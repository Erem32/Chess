# Opening study

Let a player choose an opening, read its main idea and step through example moves. Written guidance works without a video; a link can be added when available.

## Small first version

Add one reviewed opening guide as a repository file with short text and a legal move sequence. Display it on a read-only board with previous/next controls. More guides and detail levels can be added as content. No engine, backend endpoint or saved progress is required for this read-only version.

## Implementation

1. Agree a read-only board interface with the shared-board owner. A developer can write content while another builds the screen against a fixture.
2. Store the opening name, explanation, moves and optional video link in a simple file. Check that the moves are legal and content is permitted to be reused.
3. Let the player navigate the sequence and return to the guide list. Never change a saved game while studying.

## Done when

- The player can open a guide, read it and step forward/back through the moves.
- The written guide is usable without a video, and its sequence produces the expected board positions.
- A focused move-sequence check and browser navigation check pass.
