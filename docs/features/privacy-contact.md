# Contact preferences

**Goal:** Let users control invitations and social participation. Preferences remain unchanged when the experience mode changes.

## Small first version

Add a simple setting that allows or blocks new invitations. Store it on the server so it can be enforced even when the recipient is offline or using another device. The user can still play ordinary games or practise privately; decide separately whether the setting should also affect the existing random queue and game chat.

## Implementation

- Store this one preference on the user's account using a small migration and API field; [other settings](experience-settings.md) can remain in browser storage. A mode change must not reset it.
- When an invitation is sent, check the recipient's preference on the server and give a clear unavailable response. Do not build a friends graph, age-verification system or group platform as part of this slice.
- Before enabling new stranger contact or community groups, agree on an appropriate policy for children and other users. The source document asks for controls but does not specify that policy.

## Dependencies and checks

The settings and invitations developers should agree on the field and response first; each can build against fixtures in parallel. Test preference persistence, blocked and allowed invitations, and unchanged ordinary play according to the agreed policy. Community groups remain independent and optional.
