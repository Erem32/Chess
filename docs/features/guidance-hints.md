# Optional hints

Offer optional help in lessons, puzzles and computer practice without interrupting the player. The first version is simply an authored hint shown when requested; it does not require an engine or a separate hint service.

## Implementation

- Store short hint text alongside the relevant lesson or puzzle content. Each activity decides when to offer it and keeps it optional.
- A developer can write and review hints while another builds the activity screen against example content. Agree only the small content field and display behavior.
- For computer practice, decide separately how to provide a useful hint. Do not present an engine score as an explanation or enable hints in online games without a decision.

## Done when

- The user can request or skip a hint, and it matches the current position or activity step.
- Missing hint content does not block the activity. Tests cover showing a hint, skipping it and moving to another position.

[Lessons](interactive-lessons.md), [puzzles](puzzles.md) and [computer practice](computer-practice.md) can each add hints independently. [Settings](experience-settings.md) may provide defaults later; the player can always choose whether to use them.
