# Chess puzzles

**Goal:** Let a player choose a suitable puzzle, attempt moves, retry, and view optional hints and an explanation, without a daily-streak requirement. Difficulty and help remain selectable regardless of mode. This feature is proposed.

## Independent first slice

Deliver a small, reviewed collection of single-move puzzles with explicit solution and explanation, difficulty filter, retry and reveal. No rating system, engine, daily schedule, or automatic personalization is required. Multimove lines and progress history can follow after the authored content and grading contract work.

## Prerequisites and boundaries

- Agree a practice-board adapter and a puzzle format: stable ID, initial FEN, side to move, difficulty, accepted UCI solution line(s), hints and explanation. Backend and UI can work against the same fixtures in parallel.
- Puzzles are separate from live `Game`/`Move` records and must not change match results or statistics. The backend validates legality and decides whether a submitted line matches accepted content; client-side highlighting is advisory.
- Curated content must come from an approved, reusable source with licensing and attribution recorded. Validate positions, legal solutions and explanation consistency before publishing; avoid fabricated analysis.
- Decide whether this first slice requires authentication or stored attempts. Persisted attempts require a reviewed migration, data-retention rules and content-version references.

## Implementation

1. Establish content loading and validation, including valid FEN, side to move, legal solution transitions, explicitly accepted alternatives, and bounded text. A static, versioned catalog is sufficient initially.
2. Add feature-specific list/detail and attempt services and request/response schemas; keep solution/hint disclosure deliberate. Define deterministic feedback for illegal, incorrect, correct, retry and reveal.
3. Implement the puzzle selection and board session in a feature-owned frontend folder. Support leaving, retrying, optional hints and explanation after an attempt without forcing a streak or mode.
4. Expand to authored multiple-move lines only when opponent replies, alternative valid solutions, progress storage and interruption behavior are defined and tested. Integrate mode defaults as a separate optional step.

## Acceptance and checks

- A player can pick difficulty, attempt a move, understand incorrect feedback, retry, see a correct result and read an explanation.
- Server grading resists incorrect or illegal submissions and does not treat an unlisted but legal move as illegal chess. Every published line replays legally and accepted alternatives are handled as specified.
- Puzzle interaction cannot mutate an online match. Tests cover invalid content, both colors, promotion, permitted alternatives, retry/reveal, authorization where applicable, and a browser session with a disposable dataset.

## Parallel ownership and decisions

One branch owns catalog and grading; another owns the screen using contract fixtures. Coordinate the practice-board contract before merging. Agree initial difficulty labels, allowed alternatives, the licensed content source, hint policy and progress retention. Source: [Project Helix specification, sections 2.3 and 3.3](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit).
