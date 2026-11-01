# Completed-game review

**Goal:** Let a player open a finished game, navigate recorded moves and inspect important moments, with explanations and alternatives when available. Review is optional; if analysis is unavailable, recorded moves must remain usable.

## Independent first slice

Ship an authorized, read-only move-by-move replay of a completed human game. Use recorded moves and positions without assigning quality labels or claiming to explain mistakes. An analysis-backed summary is a separate later increment, dependent on verified analysis and content decisions.

## Prerequisites and current constraints

- The existing `GET /api/v1/games/{id}` and `/moves` endpoints check player membership; move rows contain UCI, SAN and `fen_after_move`. Confirm pagination and consistency assumptions before extending these contracts.
- Agree a read-only board adapter and replay snapshot format, including initial position and whose perspective is shown. Existing games start from standard chess, but future games may not; new storage needs an explicit starting position and a non-destructive compatibility strategy. Do not rewrite historical records without authorization.
- A review is separate from a live session. Never write review navigation or alternatives into the recorded game, trigger moves on the game socket, or change the result.
- Key-moment selection, verified alternatives and plain-language explanations require a source and quality policy. An engine/provider is not currently part of the project; its choice, licensing, deployment, availability and scope require approval. Use a provider interface and an explicit unavailable state rather than inventing advice.

## Implementation

1. Define review eligibility and server authorization using existing participant access checks. Return ordered move history and a trustworthy initial position; detect gaps or inconsistent stored positions and explain when replay cannot continue.
2. Build a feature-owned review screen using fixture-backed board navigation, SAN move list, opening/current position and exit. Keep a read-only adapter independent of `GamePage` and its live WebSocket.
3. Add optional analysis as a separately reviewable capability: select reviewed moments, attach provenance and version to each explanation and alternative, and display them alongside the corresponding position. Keep navigation available if analysis fails or is absent.
4. Apply mode-based detail as a default only, with user control to show more, less, or no explanation. Avoid making personal settings prerequisites for basic replay.

## Acceptance and checks

- Both participants can open their completed game and step from the start through the last move and back; an unrelated user cannot access it. The recorded game and result remain unchanged.
- The user can review moves without analysis; unavailable or invalid explanation data is identified rather than presented as fact. Invalid or incomplete histories fail safely with an understandable message.
- Test access control, ordering, starting state, castling, en passant, promotion, missing/corrupt history, board navigation, and unavailable analysis. Include an isolated two-player browser path to a completed-game replay.

## Parallel ownership and decisions

One branch owns replay API and validation, another the read-only UI using contract fixtures, and a separate content/provider branch explores analysis after approval. Coordinate board adapter ownership and game initial-position migration with the foundation owner. Decide review visibility, historical initial-position policy, analysis provider and explanation verification before the relevant increments. Source: [Project Helix specification, sections 2.3 and 3.3](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit).
