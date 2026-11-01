# Opening study

**Goal:** Let users select a common opening, read its aim, explore board examples, and choose an introductory or more detailed guide. A video link is optional; written guidance must remain useful without it.

## Independent first slice

Publish one reviewed written opening guide with a short legal move sequence and a next/previous board explorer. The guide is read-only and independently selectable; no engine, game analysis, automatic mode selection, video integration or user-progress storage is required.

## Prerequisites and boundaries

- Agree a read-only board adapter and a small versioned guide format: stable guide ID, title, level, reviewed prose, initial position, legal UCI sequence and optional external video URL. A standalone screen can use fixtures while the shared adapter is built.
- This is study content, not a live `Game`; do not write moves to an existing game or alter its result. If a later exercise submits moves or records progress, validate chess moves on the backend and define a separate practice session.
- Arrange rights and attribution for prose, positions and external references. Review chess explanations and branches with a knowledgeable author; availability of videos must never be required for the guide.

## Implementation

1. Create a validated, versioned guide catalog. Reject malformed positions, illegal sequences and malformed links during content checks; avoid embedding remote video unless specifically decided.
2. Add a feature-owned catalog/detail endpoint if content is server-managed; a bundled reviewed catalog can be the first slice if the team chooses. Keep API/content ownership separate from live-game routes.
3. Implement guide selection, text, and board navigation using the shared read-only adapter. Allow users to choose the level of detail independently of experience mode; opening a video must not prevent returning to written material.
4. Extend content with authored responses and variation branches as separate reviewed data, not hard-coded UI logic. Consider persistent bookmarks only after product and migration decisions.

## Acceptance and checks

- A user can select the guide, read the main idea, step forward/back through examples and return to the list. The written guide remains available if there is no video or the external link fails.
- Each stored sequence is legal and navigation reaches the expected positions for both board orientations. No match or player statistic changes.
- Test catalog validation, invalid links, sequence navigation and a browser journey; verify text and optional media against the chosen content license.

## Parallel ownership and decisions

A content owner can write/review guides while a frontend developer implements fixture-driven navigation. Coordinate only the read-only board adapter and catalog schema with the foundation owner. Choose initial openings, content format, level labels and video-link policy before implementation; source: [Project Helix specification, sections 2.3 and 3.3](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit).
