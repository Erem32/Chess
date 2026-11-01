# Authored teaching examples

## Outcome

Provide a few prepared chess positions with short written explanations and illustrated moves. These examples teach an idea; they are not analysis of the player's own games.

## Implementation

- Store a few reviewed positions, explanations and legal example moves in repository files. Keep the text understandable without a chess engine.
- Use a read-only board with previous/next navigation for illustrated moves. This can share the board adaptation used by the [opening guide](opening-study.md), without requiring a shared content platform.
- Show the explanation alongside the position and let the user revisit it. Do not write anything to a live game or its result.

## Dependencies and checks

Content can be authored independently while a developer builds the view against a fixture. Integrate after the read-only board interface in [shared preparation](00-foundations.md) is available. Validate positions and moves, test navigation and isolation from saved games, and run a browser check for one example.
