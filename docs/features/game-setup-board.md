# Game setup and board feedback

## Outcome and first slice

Make opponent type and pace clear before starting a game, with a confirmation of the chosen options and a quick path to the existing untimed human game. For queue matching the opponent's identity is known only after a match; show it then. During play, show whose turn it is, whether a move registered, the result and connection recovery status. Keep the interface recognisable and changes incremental.

## Prerequisites and ownership

- The first slice can ship independently using the existing queue and untimed game. Agree on a game-setup contract with the owners of [computer practice](computer-practice.md), [game pace](game-pace-clocks.md) and [friend invitations](friend-invitations.md); do not display unsupported options as if they work.
- A reusable board/session boundary is described in [shared preparation](00-foundations.md). Settings consumption is optional until [experience settings](experience-settings.md) exists; explicit game choices always win over defaults.
- Own game-setup components and feature-specific API adapter. Coordinate the dashboard, live game page, shared routes and styles with the integration owner.

## Implementation guidelines

1. Model setup as explicit choices, separate from the current matchmaking queue; expose existing behavior first. Describe opponent type and untimed pace before submission, then show the matched player after the match.
2. Introduce adapters for approved new opponent and pace capabilities only after their server contracts exist. Mode may suggest a default, but all supported choices remain selectable.
3. Reuse the board boundary with clear selection and move feedback, click/drag behavior and promotion. Represent pending, disconnected and failed operations without claiming a move succeeded before the server confirms it.
4. Permit resizing through settings where supported; test touch and mouse on representative devices without requiring a wholesale interface overhaul.

## Acceptance and tests

- A player can identify opponent type and pace before joining the existing queue, then see the matched player and agreed pace. This works without new preferences or feature services; a quick start remains available.
- New choices appear only when their corresponding backend supports them; explicit choices are retained across validation errors. Reconnect restores the authoritative board and game state.
- Test setup validation, queue errors, confirmed and rejected moves, reconnect, both board orientations and a real two-player flow.
