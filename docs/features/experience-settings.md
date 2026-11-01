# Experience settings

## Minimum feature

Add a small settings panel for Beginner, Casual or Advanced and optional text size, board size and hints. A mode supplies defaults; the player can change individual choices. Store preferences in the browser initially, like the current theme setting, so no database migration is needed. Existing users start in Beginner mode.

## Implementation

- One settings owner defines a small plain JavaScript object and helper with defaults. Feature pages read it where relevant; they must also work if settings are absent.
- A manual mode choice takes precedence over automatic selection until the player turns automatic mode back on. Never change the opponent or clock of an active game.
- Keep settings across reloads in the same browser. Cross-device sync can be added later if needed.

## Dependencies and tests

Independent branch; coordinate setting names with [automatic modes](adaptive-modes.md) and the board owner. Test defaults, changing a mode without losing individual choices, manual override and reload. Check the settings on the existing game screen without redesigning it.
