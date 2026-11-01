# Play with a friend

**Goal:** Invite a known user to an untimed game and show whether the invitation is pending, accepted or declined. A timed invitation can follow the [clock feature](game-pace-clocks.md).

## Small first version

Enter an existing username and send an invitation. The recipient accepts or declines; both players see the same game when it is accepted. A friends list, search directory and community groups are not required.

## Implementation

1. Add a small invitation table with sender, recipient, status and resulting game ID. Only those two users can see or change it; reject self-invitations. Use simple polling for pending invitations.
2. On acceptance, create the game using the existing game service or a small shared creation function. Make acceptance transactional so a repeated or simultaneous request cannot create two games. Respect the existing active-game rule unless the team decides to change it.
3. Add a small invitation form and pending/accept/decline view. Start with untimed games and display the opponent and pace; retain the normal matchmaking option.

## Dependencies and checks

- Decide the minimal [contact preference](privacy-contact.md), including whether a user can receive invitations. Coordinate game creation with the existing matchmaking code; no complete lifecycle rewrite is required.
- Backend and frontend developers can work separately using example request/response fixtures, then integrate their branches.
- Test unauthorized access, self-invites, accept/decline, duplicate acceptance and existing active games. Run a two-browser test with disposable accounts.
