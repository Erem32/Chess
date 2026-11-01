# Friend and family game invitations

**Source:** Project Helix, §2.3 and §3.3, playing with known people. **Status:** proposed; the identity and contact rules need product decisions before implementation.

## Outcome

A user selects a known person, proposes a game and pace, and can see whether the invitation is pending, accepted, declined or unavailable. The intended recipient can accept or decline; acceptance opens the same game for both players. Participation is optional, including for users who prefer private practice.

## Prerequisites and decisions

- Agree a game-creation/participant boundary and existing-active-game policy shared with matchmaking and practice. The current matchmaking queue only matches the oldest waiting player and immediately resumes an existing active game.
- Decide how a known person is identified and invited (for example, exact username or a private code), whether invitations expire or can be cancelled, and how users control contact. Avoid assuming a public directory or a full friends graph is required.
- Agree invitation eligibility and child-appropriate [contact controls](privacy-contact.md) before any stranger contact; coordinate with the optional community brief. Agree whether an invitation is untimed initially or supports the separately approved clock contract.

## Implementation guidelines

1. Store invitation ID, sender, intended recipient, proposed pace and state with creation/expiry timestamps. Add a reviewed migration and indexes required by the actual access paths; existing games and statistics remain unchanged.
2. Authorize every read and transition to the participants. Prevent self-invites and invalid or unavailable recipients. Keep state transitions explicit: pending to accepted, declined, cancelled or expired; return a useful current state after retries.
3. Accept and create the game atomically, using a consistent lock order with queue and active-game checks. Duplicate or concurrent accepts must return the same game, never create two. Resolve accept-versus-decline/cancel/expiry and matchmaking-versus-invitation races in PostgreSQL tests.
4. Deliver invitation state through a documented REST interface and a bounded refresh or existing event mechanism; do not assume the game-only socket can notify a user who is not in a game. Refresh pending state after reconnect.
5. Put invitation setup/status in a feature-owned screen and API module. It should state the identified opponent and pace, allow decline/cancel as approved, and provide a clear recovery path if no invitation is accepted.

## First independent slice and parallel work

A direct untimed invitation by exact existing username, subject to the agreed contact policy, is a self-contained first slice once the game factory contract is available. A frontend branch can implement the state screens against fixtures while backend invitation persistence and transactional acceptance are built separately. Timed invitations depend on the game-pace contract; user discovery and groups are not prerequisites.

## Acceptance checks

- Only sender and intended recipient can view or act on an invitation; a declined or expired invitation does not start a game.
- Acceptance produces exactly one game with the intended two users and agreed pace. Repeated accept, concurrent accept/decline, and active-game conflicts behave consistently and visibly.
- Both users can recover the pending/accepted status after refresh; existing queue matchmaking remains unaffected.
- Run endpoint/authorization tests, isolated PostgreSQL race tests, and a two-browser acceptance and decline smoke test.
