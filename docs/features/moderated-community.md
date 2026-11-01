# Optional moderated community

**Source:** Project Helix, §2.3 and §3.3, optional small moderated groups. **Status:** optional and decision-gated; obtain explicit approval before implementing this substantial feature.

## Outcome

Users may choose to participate in small moderated groups for friendly discussion and shared progress. Private practice and ordinary games remain available without joining. Contact from strangers is controlled, with child-appropriate rules designed and tested before opening the feature.

## Prerequisites and decisions

- Agree whether to ship groups at all, who may create/join them, moderation responsibilities and capacity, user reporting and response process, retention/removal policy, and rules for contact and minors. The source calls for moderation and controls but does not define the policy; do not invent a compliance or age-verification regime.
- Identify a person or team who can actually moderate and respond before enabling user-generated community content. Decide whether the existing in-game chat is covered by any new contact policy; avoid silently changing established game chat.
- Friend invitations can ship independently; groups must not be a prerequisite for learning, practice or known-person games. An experience mode cannot override a user's [contact or privacy choice](privacy-contact.md).

## Implementation guidelines

1. Document approved membership, visibility, roles and content lifecycle before building UI. Model groups, membership, messages and moderation actions separately from game chat, with a reviewed migration and ownership/authorization checks.
2. Provide auditable role-checked actions and a report/review flow consistent with the agreed policy. Avoid exposing member data or unsolicited contact merely because a user enters a group.
3. Give users clear opt-in, leave and contact controls, preserve privacy settings across mode changes, and explain what happens to existing content on leaving according to the approved policy.
4. Use feature-scoped endpoints, services, repositories and frontend routes; integrate through existing auth and a documented permission boundary. Do not introduce broad administration, rankings or unrelated social features without approval.
5. Start with the simplest transport consistent with the approved experience; validate operational and moderation workflows before adding real-time group messaging. Keep test content and accounts isolated.

## First independent slice and parallel work

A specification and moderation prototype can be developed independently using local fixtures, without exposing communication or storing production data. Backend and frontend can then work against a reviewed membership and permissions contract. Actual group communication remains blocked until scope, policy and responsible moderators are approved.

## Acceptance checks

- Users can use the application without joining groups; privacy/contact settings persist through mode changes.
- Only authorized members can access group content, and moderators can carry out the approved reporting and response workflow; rejected actions do not leak information.
- Tests cover permission boundaries, joins/leaves, report handling, moderation actions and retention behavior. Validate child-appropriate scenarios with appropriate participants and safeguards before release.
