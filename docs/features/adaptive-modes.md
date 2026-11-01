# Automatic experience modes

## Outcome and first slice

When enabled, recommend or select Beginner, Casual or Advanced using relevant choices and activity. Show the active mode and a plain explanation; allow reversal and a manual choice at any time. Manual selection pauses automatic changes until the player re-enables them. With insufficient information use Beginner. Never use age as a selection signal.

## Prerequisites and ownership

- Requires the manual [experience settings](experience-settings.md) contract and persisted override precedence. Develop the decision function with deterministic fixtures in parallel; integrate only when that contract exists.
- Coordinate event names with lessons, hints and practice owners. An empty-signal state must work without those features. Do not make feature functionality depend on the recommendation service.
- Product decision before automatic changes: approve the signals, thresholds, collection/retention, reason wording, review cadence, and how to prevent unwanted changes. The research document describes these as proposals, not validated thresholds. No decision may change an active game's pace or opponent mid-game.

## Implementation guidelines

1. Define a small, versioned, deterministic recommendation policy over explicitly available signals. Start with opt-in or rollout policy approved by the owner; do not treat interview observations as validated rules.
2. Keep recommendation, active mode, explanation and manual/automatic selection state separate from individual preference overrides. Explain changes, let the player reverse them, and retain manual choices until automatic selection is re-enabled.
3. Avoid collecting extra behaviour simply to infer a mode. Record only the minimum approved signals and reason data, with clear deletion/retention behavior. Do not use age or protected characteristics as inputs.
4. Test the proposal with representative users before expanding signals or applying automatic changes broadly.

## Acceptance and tests

- No signals produces Beginner; approved signals produce predictable explanations and mode choices. Empty or unavailable signals never block access.
- Manual mode and individual preferences survive activity and mode changes; re-enabling automatic mode is explicit. Changes can be reversed.
- Unit-test policy boundaries, insufficient data, override precedence and reversal; integration-test persistence and feature consumption. Record user testing as research, not as an assumed outcome.
