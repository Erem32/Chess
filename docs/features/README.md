# Project Helix: a small implementation plan

This is a university-project interpretation of [Project Helix Shared](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit). Build on the existing chess app and use small, understandable solutions. The document proposes several features; the table separates a useful first version from work that can follow. Nothing here authorizes implementing a large feature without the approval required by [project instructions](../../AGENTS.md).

## What to build

| Feature | Small first version | Later, if wanted |
| --- | --- | --- |
| [Settings](experience-settings.md) | Three modes, text/board size and hints stored in the browser | Sync settings between devices |
| [Automatic modes](adaptive-modes.md) | Suggest a mode from an explicitly selected activity difficulty; explain it and allow override | More signals, if they prove useful |
| [Game setup](game-setup-board.md) | Make the existing human opponent and untimed pace clear | Add choices as their features become available |
| [Lessons](interactive-lessons.md) | One piece lesson, then more checked-in lessons | Saved progress |
| [Hints](guidance-hints.md) | Optional written hints included with lessons and puzzles | Better computer-practice hints |
| [Puzzles](puzzles.md) | A few checked-in single-move puzzles | Multi-move puzzles and progress |
| [Opening study](opening-study.md) | One written guide with a board and next/previous moves | More guides, variations and optional video links |
| [Game review](game-review.md) | Read-only replay of completed games | Verified explanations and alternatives; replay alone does not fulfil this part of the source |
| [Computer practice](computer-practice.md) | Separate untimed session against a simple legal-move opponent | Stronger opponents and meaningful difficulty choices |
| [Game pace](game-pace-clocks.md) | Make the existing untimed option explicit | One server-controlled timed option; more presets later |
| [Contact preference](privacy-contact.md) | A server-stored allow/block invitation setting | Additional contact controls when needed |
| [Friend invitations](friend-invitations.md) | Invite an existing username to an untimed game | Timed invitations and a friends list |
| [Similar-experience matching](skill-matching.md) | Optional player-selected broad level; no ratings | A rating system only if separately approved |
| [Community groups](moderated-community.md) | Optional: leave out of the first release | A small moderated group if the team wants it and can moderate it |

All features remain in the plan; later work is explicitly identified rather than silently treated as complete. The source asks for meaningful explanations, different opponent strengths and timed play, so the simple replay, random opponent and untimed game are only first steps toward those outcomes.

## Prepare only what is needed

See [minimal preparation](00-foundations.md). The practical starting points are:

1. **Reuse the board:** Adapt the existing `ChessBoard` to display lesson, puzzle and replay positions without the live socket. Preserve normal online play and server-side chess validation.
2. **Keep learning content simple:** Put a few reviewed lessons, puzzles and guides in repository files. Use a small backend move check for interactive exercises; no content management system or new infrastructure is needed.
3. **Keep private practice separate:** The current game model expects two registered users. A small backend practice endpoint can replay and validate the moves, then pick a legal computer move, without fake accounts or changing existing game history.
4. **Coordinate shared edits:** Agree basic board and response shapes before parallel work; one person integrates shared routes and any migrations. Preserve existing games and test on disposable data.

## Work in parallel

- **Developer A — shared board and settings:** Small reusable board changes and the settings object. Publish examples so other branches can use fixtures.
- **Developer B — lessons and puzzles:** Start content and screens against those examples. Lessons and puzzles can also be split between two developers because each owns its own page and content.
- **Developer C — opening guide and game replay:** Develop read-only screens against example positions and existing game history.
- **Developer D — practice and invitations:** Build the separate practice endpoint or direct invitation flow. Coordinate only where routes or database migrations overlap.

Merge the small shared board changes first, then integrate and test each feature separately. Automatic mode selection needs settings and an activity difficulty. Invitations need the server-stored contact preference; timed games need agreed clock rules and a backend migration. Similar-experience matching and optional groups do not block the learning features or private practice.

Keep one short feature brief per branch, with a small acceptance test. Use the existing backend authority for chess, keep tests and data isolated, and avoid unnecessary services, background workers or broad interface changes. Decide who owns content and confirm it can be reused. Test the main journeys with real users when practical; the source's interviews and suggested targets are not implementation results.
