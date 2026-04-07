# NASQ NACIRE Tech Plan

## Foundation
- Frontend framework: `Next.js` with the App Router.
- Backend platform: `Supabase` for Postgres, authentication, row-level security, storage, and vector-backed retrieval.
- Styling approach: custom design system extracted from the artifact HTML, not a generic UI kit.
- Runtime architecture: server-first for reads, auth checks, and route protection; client components only where interaction requires them.
- Deployment posture: hosting-portable architecture without unnecessary platform lock-in.

## Application Structure
- Public routes: dashboard, challenges, challenge detail, solutions, solution detail, AI assistant, analytics.
- Member routes: submit challenge, drafts, account, owned challenges, owned solutions.
- Admin routes: moderation, taxonomy management, company governance, link oversight.
- Shared shell: sidebar, topbar, layout, shared cards, badges, prompts, filters, chart surfaces.

## Core Entities
- `User`
- `CompanyProfile`
- `Membership`
- `Sector`
- `Challenge`
- `ChallengeDraft`
- `Solution`
- `ChallengeSolutionLink`
- `RelayThread`
- `RelayMessage`
- `Vote`
- `AIConversation`
- `AIMessage`
- `AnalyticsEvent`

## Key Technical Rules
- A user belongs to one or more companies through memberships and role state.
- A verified member is an authenticated user with a verified contribution role.
- Challenges and solutions are independent records.
- A solution may link to multiple challenges.
- Anonymous challenge ownership is stored internally but masked in public reads.
- Sector records include name, description, display order, visibility, and icon metadata.
- Analytics events are append-only behavioral records.

## Auth and Security Posture
- Supabase auth with server-aware session handling.
- RLS enabled on all sensitive tables.
- Validation at every mutation boundary.
- No trust in client-provided role or ownership values.
- Privacy-safe AI retrieval so anonymous ownership never leaks through search, citations, or prompts.
- Audit-friendly moderation and status transitions.
- Secrets only through environment configuration.

## AI Architecture
- Retrieval corpus limited to internal platform content in v1.
- Provider abstraction for embeddings and generation from day one.
- Vector-backed retrieval over challenge and solution content.
- Citation formatter that links answers back to platform records.
- Member-only action to convert AI output into a structured challenge draft.

## Frontend Fidelity Strategy
- Extract the artifact’s visual language into reusable tokens and components.
- Preserve fonts, color palette, spacing feel, card styling, chart tone, and navigation structure.
- Translate demo interactions into real route-based behavior without altering the visual composition.
- Add responsiveness and accessibility only where the artifact is silent.

## Execution Discipline
- TDD for feature work.
- Unit, integration, and Playwright coverage for critical flows.
- Docs-grounded implementation using Docmancer-style official documentation lookup.
- Security review before major merges.
- Cross-check between artifact fidelity, product rules, and database permissions before closing tickets.
