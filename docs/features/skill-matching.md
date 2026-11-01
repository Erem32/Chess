# Similar-experience matchmaking

**Goal:** Offer an optional way to look for someone with similar experience. The source proposes this alongside ordinary matchmaking; it does not require an Elo system or rankings.

## Small first version

Allow a player to choose a broad experience level before entering the queue. Match opted-in users only according to the agreed preference. Explain that a small user base can mean waiting; allow the player to cancel or choose ordinary matching. Never widen the preference without asking.

## Implementation

1. Agree on simple labels and the behavior when only one player has a preference. Store the selected option with the queue entry and compare it in the existing matchmaking service.
2. Keep the choice separate from an automatic experience mode: it is a player-selected preference, not a measured chess rating. Preserve existing queue behavior when the option is not used.
3. Add a small optional selector and a clear waiting state. Do not build ratings, leaderboards, or a matching service for the first version.

## Dependencies and checks

- Coordinate the queue field with the invitation/game-creation changes and the [contact preference](privacy-contact.md). This feature is separate from practice and friend invitations.
- Test compatible and incompatible choices, ordinary matching, cancellation and concurrent joins. Make sure each match creates only one game.
- A future rating-based system requires a separate product decision.
