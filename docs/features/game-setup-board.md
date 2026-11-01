# Game setup and board feedback

## Minimum feature

Keep the existing game flow and make it clear that a player is joining an untimed game against another person. Show the matched opponent after matching, plus turn, move and connection feedback during play. Avoid a new setup system until another opponent or pace is implemented.

## Implementation

Make small changes to the dashboard and game screen. The backend remains authoritative: show a move as complete only when the server confirms it. Preserve existing click, drag, promotion and reconnect behavior. Apply board/text settings where available; the game must work without them.

## Dependencies and tests

Independent branch using the existing queue. Coordinate shared board and dashboard files with other developers. When computer practice, invitations or timed play are ready, add their choices in those feature branches. Test queue errors, both players making moves and reconnecting, and the matched opponent display.
