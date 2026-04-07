# Implementation Rules

## Non-Negotiables
- Match the artifact visually as closely as possible.
- Do not redesign the interface.
- Treat the artifact as the visual source of truth and the spec docs as the behavioral source of truth.

## Engineering Rules
- Validate all mutations at system boundaries.
- Enforce authorization in database policies and server boundaries, not only in the UI.
- Keep public-safe read models explicit.
- Never leak anonymous challenge ownership through UI, joins, analytics, or AI.
- Use immutable update patterns and clean separation by product domain.

## Quality Rules
- Follow TDD for feature work.
- Add unit, integration, and Playwright coverage for critical flows.
- Run security review before closing major implementation phases.
- Re-check library and framework behavior against current official docs during execution.

## Product Rules
- Challenges and solutions are separate reusable records.
- Challenges go through review before publication.
- Verified-member solutions publish immediately in v1.
- Analytics remains public.
- Admin governance remains protected.
