# Display and move guidance settings

## Outcome

Let a user change text size and turn legal-move guidance on or off. The board adapts to the available screen; the settings must remain easy to find and change back.

## Implementation

- Add a small settings control for text size and move guidance. Use a few fixed text sizes rather than a complex editor.
- Store choices in browser `localStorage`, following the existing theme setting. Use the current text size and enabled move guidance as defaults so existing users retain the current experience. Handle missing or invalid stored values with those defaults.
- Apply the text setting consistently across the app. Pass the guidance setting to the shared board so it controls visible legal-move markers in online games, lessons and puzzles. It must not change which moves are legal or prevent a player from making a legal move.
- Preserve the existing theme setting and the board's click, drag and promotion behavior. Chess move validation remains on the backend.

## Dependencies and parallel work

The settings UI can be developed independently using a local board fixture. Agree the small board option and default values with the shared-board and lesson owners before integrating their branches. This feature needs no backend changes or database migration.

## Acceptance and checks

- A user can increase and restore text size and switch move guidance on and off; the controls show the current choices.
- Choices persist after reload in the same browser. Missing or invalid saved settings use the defaults.
- Guidance changes only the markers, not server-side move validation. The board remains usable at phone, tablet and desktop widths.
- Test preference defaults and persistence, both guidance states and a legal move with guidance disabled. Check the settings and board in a browser at narrow and wide widths.
