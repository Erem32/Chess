# Project Helix implementation plan

This plan follows the revised [Project Helix Shared specification](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit?tab=t.0), sections 2.3 and 3.3. It uses the existing application and keeps the work small enough for a university project. Each feature has its own brief and can be developed on a separate branch.

## Features to implement

| Feature | Scope | Prerequisite |
| --- | --- | --- |
| [Display and guidance settings](experience-settings.md) | Text size and an on/off control for legal-move markers | Agree a small board option; store preferences in the browser |
| [Piece lessons](interactive-lessons.md) | Six short authored lessons, one per piece, with practice and feedback | Reusable practice board and move checking |
| [Puzzles](puzzles.md) | A handful of authored puzzles with retry, solution and explanation | Reusable practice board and move checking |
| [Opening guide](opening-study.md) | One short written guide with board examples and an optional video link | Read-only board |
| [Teaching examples](teaching-examples.md) | A few authored positions with explanations and illustrated moves | Read-only board |
| [Online game feedback](game-setup-board.md) | Review and improve the existing queue, connection and move feedback where needed | Existing game flow; independent of learning features |

Private practice means trying the prepared positions in lessons and puzzles. It does not require a separate game system. Optional move guidance is part of settings, not a separate hint service. Queue joining and cancellation are part of the online-game brief, not a second matchmaking feature.

## Prepare the repository

[Shared preparation](00-foundations.md) describes the small changes needed before integration:

1. Adapt the existing board for practice and read-only positions, with an option to hide legal-move markers. Preserve the live game and backend authority.
2. Add a way for practice screens to report an invalid attempt. The current board filters illegal moves before its move callback, so feedback cannot be built by wiring up that callback alone.
3. Use small checked-in files for reviewed lessons, puzzles, the opening and examples. Reuse backend chess validation for interactive attempts; keep practice separate from live games and statistics.

## Work in parallel

- **Board/settings owner:** agree the board props and attempt response, implement the small board adaptation and settings.
- **Lesson and puzzle owners:** write content and build their own screens against sample responses. They can work separately and integrate after the board contract is ready.
- **Opening/example owners:** write content and build read-only views against sample positions. They can work separately and reuse the read-only board.
- **Online-game owner:** review the existing queue and game feedback and make only observed, targeted fixes. Coordinate any shared board edits with its owner.

One integrator coordinates the shared board, navigation and any backend route changes. Merge the board contract first, then integrate each feature independently with focused tests and disposable browser data. Preserve the existing online game throughout.

## Evaluation

Use the source document's scenarios to test lessons, puzzles, examples, the opening, settings and the online queue with a small group on relevant devices. Record participant counts, independent completion, assistance, errors and feedback. The document's 80% completion and satisfaction figures are provisional targets, not results; report actual counts and do not generalize from the small sample.
