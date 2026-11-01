# Automatic experience modes

## Minimum feature

Use a simple, explainable rule based on the difficulty the user explicitly chooses for a lesson or activity: introductory maps to Beginner, standard to Casual and advanced to Advanced. Use Beginner if there is no choice. Show the active mode and a short reason. Let the user select a different mode; that manual choice stays until automatic mode is turned back on. Never infer a mode from age.

## Implementation

- Keep one small decision function alongside [experience settings](experience-settings.md). Reuse explicit choices already available in the browser; do not build telemetry, analytics, a background service or a scoring model.
- A mode changes suggested defaults only. The user can still choose any available lesson, opponent, pace or hint setting. Preserve individual choices and do not change an active game.
- Keep the mapping and reason text in one small helper. Hint-use or completed-activity signals are later options, not required for the first version.

## Dependencies and tests

Requires the settings object and at least one activity with an explicit difficulty choice; the decision function can be developed with fixtures in parallel. Test no choice, all three mappings, visible reason, manual override, re-enabling automatic mode and preserved individual settings.
