# Recommended scope cuts

These are recommendations for updating [Project Helix Shared](https://docs.google.com/document/d/16WxbylyCP4k2OvAuh3xz5v-DbWU0wTTaF9Sy9nGcxjQ/edit), not decisions already made. Check the course rubric before removing any required item. The other feature briefs describe the source as it stands; do not implement these cuts as if they were approved.

| Requirement to reconsider | Recommended replacement | Tradeoff |
| --- | --- | --- |
| Automatically select and change three experience modes based on behaviour | Let the user turn guidance on or off and adjust board/text size. Do not automatically change the interface. | Users control their experience, but the app will not adapt itself. |
| A strong computer opponent with several levels and useful hints | Make computer play optional. If included, offer one clearly labelled simple opponent that chooses legal moves. | It will not provide realistic difficulty levels or reliable strategic hints. |
| Automatically explain mistakes and suggest better moves in any completed game | Offer read-only replay. Use a few authored examples for teaching; do not label a user's moves as mistakes automatically. | Players can revisit their games but will not receive personalized analysis. |
| Timed and untimed games with several controls | Support untimed games only. | Players who want clock pressure cannot use it. |
| Match strangers by skill or rating | Keep ordinary matchmaking and allow invitations by username. | Opponents found through the queue may differ in experience. |
| Moderated groups and community discussion | Remove groups from this project. Keep the existing in-game chat and direct invitations if implemented. | There is no community space inside the app. |
| Many lessons, puzzle levels, openings and explanations | Include one short lesson per piece, a handful of authored puzzles and one opening guide. | Content will be limited, but each journey can be demonstrated. |
| Fixed success and satisfaction targets for several user groups | Run a small usability pilot and report the number of participants, completed tasks and observed problems. | The project will not claim statistical confidence from a small sample. |

## Suggested project scope

1. Keep the existing two-player game and make its entry point clear.
2. Add a small learning area with piece lessons, a few puzzles and an opening guide using reviewed files in the repository.
3. Add read-only replay and simple personal settings.
4. Add a direct invitation or a simple computer opponent only if time allows; both can be developed separately.

This scope does not fully implement the current source document: in particular, it excludes automatic adaptation, personalized game analysis, timed play, skill matching and groups. Update the source wording if these cuts are accepted; otherwise treat the affected briefs as future work rather than claiming they are delivered. Use the [feature index](README.md) for implementation notes and dependencies.
