# Project Helix feature plan

This plan translates [Project Helix Shared](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit), especially sections 2.3 and 3.3, into implementation briefs. The source presents proposals and research scenarios, not validated outcomes. These files describe possible work, not features already delivered or authorization to implement large features. The current project instructions and server-authoritative chess rules still apply.

The application already provides registered-user matchmaking, two-player online games, live moves, chat and game history. The briefs identify new behavior and the changes needed to support it. A feature can be prototyped on its own branch using documented fixtures, but its integration prerequisites must be met before it is exposed to users.

## Features

| Feature | Independent first deliverable | Integration prerequisites |
| --- | --- | --- |
| [Experience settings](experience-settings.md) | Manual mode and preference selection | Preference contract; no automatic selection required |
| [Automatic experience modes](adaptive-modes.md) | Deterministic recommendation with fixtures | Settings and approved signals, thresholds and rollout |
| [Game setup and board feedback](game-setup-board.md) | Clear setup for an existing untimed human game | Existing game flow; shared board contract for reuse |
| [Interactive lessons](interactive-lessons.md) | One repeatable piece lesson | Practice board and authored content contract |
| [Optional hints](guidance-hints.md) | Authored help for one lesson | Consuming lesson contract; other providers optional |
| [Computer practice](computer-practice.md) | Untimed practice with an approved simple opponent | Game creation/participant contract and opponent decision |
| [Game pace and clocks](game-pace-clocks.md) | Explicit untimed setup; clock domain developed separately | Game creation; timed policies and authoritative clocks before timed play |
| [Completed-game review](game-review.md) | Authorized, read-only move replay | Read-only board and starting-position contract |
| [Puzzles](puzzles.md) | Small authored single-move puzzle set | Practice board and licensed content contract |
| [Opening study](opening-study.md) | One written guide with board navigation | Read-only board and content contract |
| [Contact controls](privacy-contact.md) | Explicit participation preferences | Preference contract and approved contact policy |
| [Friend invitations](friend-invitations.md) | Direct untimed invitation between known users | Game creation, active-game and contact policies |
| [Similar-skill matchmaking](skill-matching.md) | Optional broad preference using agreed fixtures | Matching/contact policy; any rating system requires approval |
| [Moderated community](moderated-community.md) | Policy and prototype using fixtures | Explicit approval, workable moderation and contact rules before release |

## Preparation before implementation

[Shared preparation](00-foundations.md) defines the intended game-creation, participant, board, content and preference seams. Start by agreeing on interfaces and current-game compatibility, not by building a generic framework. Specifically:

1. **Game lifecycle:** The current queue creates games for two registered users, `GamePlayer.user_id` is required, and an existing active game is resumed. Define game creation independently of matchmaking and decide how computer participants, direct challenges, clocks and multiple active games fit. Preserve existing history and statistics; review any data migration separately.
2. **Reusable board and replay:** Separate display/interaction from the live game session while preserving click, drag and promotion. Define a starting-position contract before custom positions or replay of future game types; existing snapshot and repetition code assumes standard starts.
3. **Preferences and content:** Agree minimal contracts for manual choices and versioned learning content. Keep explicit settings independent of suggested mode. Validate content and provenance. No engine is needed for authored lessons, puzzles, opening guides or basic replay.
4. **Integration safety:** Coordinate shared route registration, board/session files, event shapes and Alembic migration ordering. Keep existing HTTP/socket behavior working while new contracts are introduced. Use isolated PostgreSQL tests for transactional changes and disposable browser test data.

A feature branch must not create fake users, change game results or add mandatory infrastructure simply to bypass these decisions. The choice of computer opponent/engine, rating scheme, clock semantics, automated mode thresholds, contact policies and explanation/content sources remains open. Major capabilities such as a computer opponent, competitive ratings or community require the separate product approval specified in [AGENTS.md](../../AGENTS.md); this planning request does not authorize implementation or data backfills.

## Parallel work and merge order

| Owner / workstream | Can begin independently | Coordinate before integration |
| --- | --- | --- |
| Foundation | Lifecycle and board contracts; backwards-compatibility tests | Shared schemas, game session, common board, migrations |
| Preferences | Manual settings and mode policy using fixtures | Preference schema, policy signals and feature defaults |
| Learning | Lesson, puzzle and opening content and feature screens on separate branches | Practice/read-only board, content formats and licensing |
| Review / guidance | Replay and authored guidance using fixture positions | Read-only board, starting FEN, verified explanation source |
| Games / social | Clock policy, opponent adapter, invitations and contact-policy designs | Game factory, active-game rules, clock semantics and permission contract |

1. Agree on product decisions and contract examples; assign one owner per shared file and migration chain. Independent developers can implement feature-scoped services/screens against fixtures while foundations are being reviewed.
2. Merge compatible board and game-creation slices before feature branches that depend on them. Merge preference and content contracts before consumers; order shared migrations and rebase or merge them normally without rewriting shared history.
3. Integrate one feature slice at a time, then run contract, migration and relevant two-player/browser tests. Do not let a placeholder interface present an unimplemented capability as available.
4. Review optional automatic adaptation, skill matching and community separately. Their policies and rollout are not prerequisites for learning, private practice or games with known people.

## Validation

For each brief, verify its acceptance criteria on disposable data and test failures and recovery, not only the happy path. The source proposes research sessions with beginners and experienced players; treat the nine interviews and provisional targets as context, not proof that a design works. Record observed results and decisions before changing mode-selection rules, explanations or contact behavior.
