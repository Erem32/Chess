# Experience settings

## Outcome and first slice

Let a player choose and retain Beginner, Casual or Advanced, plus individual text size, board size, guidance, pace and social-participation preferences. These are starting preferences, not restrictions on which features or difficulty the player may use. Start with explicit manual selection and persistence; default to Beginner when no choice exists. Do not apply a mode change to an active game without the player's choice.

## Prerequisites and ownership

- Can be developed independently with a small preferences contract agreed with the adaptive-mode and game-setup owners; no engine, content, clocks or social system is required.
- Own a feature-scoped settings UI/API, validation and persistence. An integration owner coordinates route registration, common styling and the user/profile migration. Keep the existing theme preference working; define whether settings are account-wide or device-specific before implementation.
- [Adaptive modes](adaptive-modes.md) are a separate later capability and must not be required for manual settings.

## Implementation guidelines

1. Model selected mode and separately stored explicit overrides. Define precedence: explicit per-setting choice beats mode defaults; a manual mode selection remains until the player re-enables automatic selection.
2. Store only necessary choices, with additive migrations and defaults for existing accounts; do not infer age. Validate values server-side. Define how unavailable settings are described rather than silently overriding them.
3. Expose a stable read/update contract to features. Features adopt settings incrementally; preserve explicitly chosen text, board, guidance and privacy settings when mode changes.
4. Provide a focused settings view and explain which mode is active. Avoid a large redesign of existing screens.

## Acceptance and tests

- Settings persist across reload and sessions according to the agreed storage scope; existing users and accounts without preferences work.
- Users can manually choose each mode and individual settings; changing modes does not reset explicit overrides. Manual mode choice is not replaced by automatic recommendations.
- Invalid values are rejected without losing existing choices. Test API migration/defaults, update/restore flows, precedence, and consumers with missing or unsupported preferences.
