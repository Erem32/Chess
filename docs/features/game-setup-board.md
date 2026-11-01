# Online game and queue feedback

## Outcome

Keep the existing online queue and game flow clear: the user can join, see when they are waiting, leave the queue and understand connection and move status during a game. The interface should distinguish online play from the learning area.

## Implementation

- Review the existing dashboard and game feedback, then make small targeted changes where the queue, cancellation, connection or move status is unclear. Keep the current matchmaking API and game flow.
- Show waiting and leave-queue controls while searching. After matching, show the other player and whose turn it is.
- Make pending, confirmed and rejected moves understandable. Do not show a move as confirmed before the backend confirms it. Show disconnection and reconnecting states while preventing moves until synchronization is complete.
- Keep the board responsive to the screen and preserve click, drag, promotion, resignation and draw behavior. Use the existing board and session components rather than introducing a new game setup system.

## Dependencies and parallel work

This feature can be developed on its own branch against the existing queue and game APIs. Coordinate edits to the dashboard, game page and shared board with the settings and learning-feature owners. It does not depend on learning content or settings being completed.

## Acceptance and checks

- A signed-in user can join the queue, identify the waiting state and leave it before a match.
- With two users, both enter the same game, see the other player and receive clear turn and move feedback. Connection loss is visible and play resumes from the server state after reconnecting.
- Queue and move failures are visible and recoverable. Verify the flow with focused tests and a two-browser smoke test against disposable data.
