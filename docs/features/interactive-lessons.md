# Interactive chess rules lessons

**Goal:** Let a learner choose a piece, read a short explanation, try moves, receive helpful feedback, and repeat or leave the lesson. Guidance varies by experience mode, but the learner can choose whether to see hints. This is a proposed feature, not current functionality.

## Independent first slice

Ship one authored, repeatable piece-movement lesson with an isolated practice board and clear success and invalid-attempt feedback. It must be usable without automatic mode selection, an engine, puzzles, or a live game. Later add lessons for the remaining pieces, captures, special rules and mode-dependent presentation.

## Prerequisites and boundaries

- Agree the shared practice-board interface and a versioned lesson content format (position/FEN, learner side, instruction, allowed outcomes, feedback and next step). A frontend mock can be developed against that fixture before the shared adapter is merged.
- A lesson is not a `Game`: the current game endpoints expect authenticated game participants and persisted live-game state. Do not create synthetic opponents or reuse a live game's WebSocket for training.
- Use the backend chess rules service to validate submitted moves and lesson progress. Local legal-move highlights are hints, not authority. Keep arbitrary training positions and attempts separate from player match statistics.
- Author and review lesson content, including how invalid but legal moves are explained. Do not claim a chess engine can generate reliable natural-language instruction without verification.

## Implementation

1. Define a stable content ID and schema, validation errors, progress response and versioning; provide reviewed fixtures with one clear success path. Decide if accounts or persisted progress are needed for the first release.
2. Add lesson-specific backend schema/service and repository only for the approved persistence needs; add a migration if storing progress. Keep routes thin and server responses explicit about accepted moves, retry and completion.
3. Build a lesson page and board adapter in a feature-owned frontend folder. Display the current step and feedback, allow repeat and exit, and preserve voluntary hint choices. Do not modify shared game-session logic on the lesson branch.
4. Add more authored lessons and preference-aware defaults only after the base lesson is tested; mode changes must not silently overwrite individual hint preferences.

## Acceptance and checks

- From the lesson list, a player can complete, repeat and leave a lesson. A rejected attempt keeps the current step and gives relevant feedback; retry works.
- The server rejects illegal and out-of-sequence attempts even if the client is modified; legal alternatives follow the authored lesson rules rather than being reported as illegal chess moves.
- Practice leaves live games, results and statistics unchanged. Reload/resume behavior matches the selected persistence decision.
- Test content validation, legal/illegal and alternative moves, completion/retry, authorization where applicable, and a browser journey on mouse and touch-sized viewports. Use disposable data.

## Parallel ownership and decisions

One developer owns lesson content/API and another the lesson screen using agreed fixtures. Shared board changes belong to the foundation owner and merge first; the lesson branch supplies an adapter. Decide lesson coverage, guest access, progress retention and content ownership before committing to a data migration. Source: [Project Helix specification, sections 2.3 and 3.3](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit).
