# Piece lessons

## Outcome

Provide six short authored lessons, one for each chess piece. A learner reads an explanation, tries moves on a prepared board, receives feedback on an invalid attempt, and can retry, repeat or leave. Legal-move guidance follows the user's setting.

## Implementation

- Store a small set of reviewed positions, instructions, expected moves and predetermined feedback in repository files. Keep lessons separate from online games and statistics.
- Reuse the existing board after the small adaptation in [shared preparation](00-foundations.md). Its current interaction filters illegal moves before calling `onMove`, so add a practice-only way to report an invalid attempt without changing live-game behavior.
- Validate submitted practice moves on the backend using the existing chess library. Distinguish an illegal move from a legal move that does not satisfy the lesson; show authored feedback and keep the position available for retry.
- Build one lesson first, then supply the other five as content. Display guidance only when enabled in [settings](experience-settings.md).

## Dependencies and checks

The content and page can be developed in parallel against an agreed example response; integrate after the reusable board and settings interfaces are available. Test all six lesson fixtures, valid and invalid attempts, retry and exit, guidance on/off, and that no online game or statistic is changed. Run a browser check for completing one lesson.
