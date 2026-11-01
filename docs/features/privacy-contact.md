# Contact and participation controls

## Outcome and first slice

Give a player clear control over social participation and who can contact or invite them. Private practice remains available, and personal contact preferences survive experience-mode changes. The first slice defines and persists contact preferences; it does not introduce a public directory, strangers' messages, or groups.

## Prerequisites and ownership

- Coordinate preference storage and override precedence with [experience settings](experience-settings.md). Until that contract is ready, develop the policy and frontend against fixtures.
- [Friend invitations](friend-invitations.md), [similar-skill matchmaking](skill-matching.md) and [moderated community](moderated-community.md) must each apply the approved policy at their own server-side boundaries; settings alone do not enforce contact behavior.
- Decide who may contact whom, how known people are identified, defaults and settings for children, and the treatment of existing game chat and random matchmaking. The existing queue pairs players without a contact preference; the policy must say whether and how it applies. The source requires child-appropriate controls but does not define age verification or guardian workflows. Product and policy approval is required before enabling new contact channels.

## Implementation guidelines

1. Model explicit contact preferences and separate them from automatic mode selection. Validate changes and retain explicit choices across mode changes and sessions.
2. Define a small policy interface consumed by invitations and future social features; reject disallowed contact server-side and provide appropriate feedback without revealing unnecessary account information.
3. Add a focused settings view and explain the consequences of choices. Keep private activities usable when social participation is disabled; apply the agreed policy to human matchmaking and game chat.
4. Review how the policy affects minors and known-person play with suitable participants before release; make assumptions and unresolved decisions visible.

## Acceptance and tests

- Users can view, change and retain approved contact preferences without joining social features; mode changes do not reset them.
- Server-side tests cover allowed and disallowed invitations/contact, preference changes and existing game-chat policy. Browser tests cover controls, persisted choices and understandable rejection.
- Test the policy with representative users, including child-appropriate scenarios, before enabling any new stranger contact.
