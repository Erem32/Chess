# Optional similar-skill matchmaking

**Source:** Project Helix, §2.3 and §3.3, playing with others. **Status:** optional proposal; any rating or competitive ranking system needs separate approval before implementation.

## Outcome

A player who wants an opponent near their experience can request one, while retaining the existing option to play friends or practise privately. Experience modes can suggest a choice but do not prevent users selecting another. Avoid representing an estimate as an established chess rating unless that is actually true.

## Prerequisites and decisions

- Agree the signal and its semantics: self-selected experience, opt-in rating or another reviewed indicator. Decide new-player treatment, fairness, visibility, privacy and whether a player can decline or widen criteria. A small user base may mean no match is available; the source does not mandate a ranking algorithm, rating points or a waiting-time threshold.
- Agree pace compatibility with the game-pace feature, the active-game policy and game-creation contract. The current database queue accepts one entry per user and picks the oldest waiting opponent without skill or pace metadata.
- Child-appropriate [contact controls](privacy-contact.md) and any restrictions on who can be matched require an explicit policy; do not use age to select experience mode.

## Implementation guidelines

1. Implement matching preferences as an explicit optional request rather than changing the meaning of every existing queue entry. Validate allowed options on the server and persist the preference if the user can leave and return.
2. Separate candidate selection policy from queue persistence and game creation. Preserve backend authority, queue serialization and the existing active-game checks; deterministic tie breaking and an explicit no-match response make behavior understandable.
3. Keep actual user settings and private practice independent from an estimated level. If an estimated level is later approved, introduce its own documented model, provisional state and result update rules; do not reuse experience mode as a rating.
4. Extend the matchmaking interface with a clear optional setting and a waiting/cancel path. Agree any expansion of criteria with the user before broadening the search.
5. Use a migration with compatible defaults for existing queue behavior; coordinate changes to shared matchmaking and creation contracts with their owner.

## First independent slice and parallel work

After the preference and contact policy are agreed, a branch can introduce an opt-in broad experience preference and deterministic matching tests against fixture users. A separate branch can build the waiting and choice UI against fixtures. Existing unfiltered matching and friend invitations remain independent. Competitive ratings or leaderboards are outside this slice and require explicit approval.

## Acceptance checks

- An opted-in user is matched only within the agreed criteria and pace, or sees a cancellable waiting state. No-match remains a normal outcome; criteria do not silently widen.
- Existing queue users retain compatible behavior, and one request cannot create duplicate games or bypass active-game checks.
- Test new players, mismatched preferences, cancellation, refresh, concurrent joins and matching-versus-invitation races using isolated PostgreSQL where locking matters. Verify both players see the same match in a browser smoke test.
