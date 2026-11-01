# Optional guidance and hints

## Outcome and first slice

Offer optional, understandable help during lessons, puzzles and computer practice, without interrupting a player or making claims that cannot be supported. The first independent slice displays authored, position-specific guidance in one lesson; no chess engine is required.

## Prerequisites and ownership

- Coordinate a small guidance presentation contract with [interactive lessons](interactive-lessons.md), [puzzles](puzzles.md) and [computer practice](computer-practice.md). Each feature owns its content and legality checks; authored hints can be developed with local fixtures before a shared provider exists.
- [Experience settings](experience-settings.md) can supply a default but the player can override it within each activity. Hints must not reveal a puzzle solution before the user requests the relevant help level.
- Product decision: whether hints are allowed in online games, what counts as a hint signal for adaptation, and the source/licensing and accuracy standard for computer-generated explanations. Do not enable online hints or imply that engine output itself explains a move.

## Implementation guidelines

1. Represent guidance as optional, contextual and attributable to an authored content version or an approved provider; include an unavailable state.
2. Let the activity decide when to offer, reveal or dismiss help. Separate hint use from score/rating and automatic mode changes until policies are agreed.
3. For engine-backed practice, use the approved analysis/opponent provider only after its limits and explanation method are defined. Never send hidden opponent information to a client.

## Acceptance and tests

- A player can complete or leave an activity without requesting hints; requests show appropriate guidance and remain reversible.
- Hints match the current position and cannot leak into another game or activity. Missing or stale content is handled clearly.
- Test hint availability, explicit overrides, position changes, absence of guidance and any feature-specific solution-reveal policy.
