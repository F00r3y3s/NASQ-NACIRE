# NASQ NACIRE Ticket Breakdown

`Refs shorthand:` `EB` = Epic Brief, `CF` = Core Flows, `PV` = PRD Validation, `TP` = Tech Plan, `AV` = Architecture Validation.

All tickets inherit these execution rules: exact artifact visual fidelity, docs-grounded implementation using official docs, TDD-first delivery, validation at every mutation boundary, and security review before closure.

## Phase 1 Foundation

### T01 — Repo Scaffold, Planning Artifact Materialization, and Execution Baseline
`Refs:` EB, TP | `Depends:` none  
`Included:` Next.js app scaffold, route groups, environment contract, provider boundaries, planning artifact markdown materialization, decision and handoff logs, docs-grounding checklist, execution baseline.  
`Excluded:` domain features.  
`Acceptance:` the app boots cleanly, environment requirements fail safely, and the repo contains the formal planning package and working memory files.

### T02 — Artifact Design System Extraction
`Refs:` EB, TP, AV | `Depends:` T01  
`Included:` tokenizing the artifact’s palette, typography, spacing, shadows, cards, pills, tables, charts, and interaction styling into reusable primitives.  
`Excluded:` new visual redesign.  
`Acceptance:` shared UI primitives reproduce the artifact’s visual language with intentionally minimal drift.

### T03 — App Shell, Navigation, and Route Skeleton
`Refs:` EB, CF1-CF10, TP | `Depends:` T01, T02  
`Included:` sidebar, topbar, page shell, route skeletons for public, member, and admin surfaces, and active navigation states matching the artifact.  
`Excluded:` real data logic.  
`Acceptance:` every planned surface renders inside the correct shell and preserves artifact-level layout behavior.

### T04 — Core Schema and Domain Types
`Refs:` TP, AV | `Depends:` T01  
`Included:` schema design for users, companies, memberships, sectors, challenges, drafts, solutions, links, relay threads and messages, AI conversations and messages, votes, and analytics events.  
`Excluded:` permissions logic and UI flows.  
`Acceptance:` the schema fully supports validated product behavior without overloaded records.

### T05 — Auth, Membership, and Company Profile Foundation
`Refs:` CF3, CF5, CF10, CF11, TP, AV | `Depends:` T04  
`Included:` Supabase auth integration, verified-member state, role-aware session handling, protected routes, and simple public company profile foundations.  
`Excluded:` moderation workflows and feature-specific forms.  
`Acceptance:` public, member, and admin sessions resolve correctly and company identity is modeled cleanly.

### T06 — RLS, Public-Safe Read Models, and Sector Seed Data
`Refs:` CF2, CF6, CF9, CF10, PV, TP, AV | `Depends:` T04, T05  
`Included:` row-level security policies, public-safe projections and views, anonymous masking rules, and full sector taxonomy seeding including added sectors and blurbs.  
`Excluded:` feature pages that consume the data.  
`Acceptance:` only allowed data can be read or mutated for each role, and all required sectors exist as governed data.

## Phase 2 Core Experience

### T07 — Public Dashboard Data Surface
`Refs:` CF1, TP | `Depends:` T03, T06  
`Included:` dashboard queries, featured metrics, sector summaries, recent challenges, and activity feed driven by stored records and events.  
`Excluded:` admin analytics controls.  
`Acceptance:` the dashboard functions as a real intelligence homepage and no longer depends on hardcoded demo arrays.

### T08 — Challenge Browse, Search, and Filtering
`Refs:` CF2, TP | `Depends:` T03, T06  
`Included:` challenge listing, sector filters, search, sorting or pagination, status indicators, and challenge card rendering aligned to the artifact.  
`Excluded:` challenge submission.  
`Acceptance:` public users can discover published challenges efficiently and route into dedicated detail pages.

### T09 — Challenge Detail and Linked Record Experience
`Refs:` CF2, CF8, CF11, TP | `Depends:` T08, T06  
`Included:` dedicated challenge pages, full public-safe metadata, linked solutions, geography and sector context, anonymity masking, and response entry points.  
`Excluded:` draft editing.  
`Acceptance:` each challenge detail page is complete, credible, and privacy-safe for public viewing.

### T10 — Challenge Draft and Submission Workflow
`Refs:` CF3, CF7, TP | `Depends:` T05, T06, T08  
`Included:` structured submission form, save-as-draft, resume draft, anonymity controls, geography controls, validation, and submit-for-review flow.  
`Excluded:` admin review UI.  
`Acceptance:` verified members can move from blank form or AI-assisted draft to a pending-review challenge without losing data.

### T11 — Solution Authoring and Immediate Publishing
`Refs:` CF5, TP | `Depends:` T05, T06  
`Included:` solution creation and editing, reusable metadata model, optional challenge linking, and immediate publication for verified members.  
`Excluded:` advanced moderation workflows.  
`Acceptance:` verified members can publish standalone reusable solutions and manage their own records.

### T12 — Solution Browse, Detail, and Public Company Profiles
`Refs:` CF4, CF11, TP | `Depends:` T08, T11, T05  
`Included:` solution listing, dedicated solution pages, linked challenge context, voting or engagement display if kept in v1, and simple public company profile pages where identity is visible.  
`Excluded:` private company management features.  
`Acceptance:` public users can browse solutions, inspect providers where allowed, and understand how solutions relate across challenges.

## Phase 3 Intelligence and Governance

### T13 — Anonymous Relay Messaging
`Refs:` CF8, TP, AV | `Depends:` T05, T06, T09, T11  
`Included:` relay thread model, response initiation from anonymous challenges, protected message exchange, and identity masking rules.  
`Excluded:` open public comments or chatrooms.  
`Acceptance:` verified members can respond to anonymous challenges through the platform without exposing the owner’s identity.

### T14 — AI Assistant Experience and Conversation Persistence
`Refs:` CF6, CF7, TP | `Depends:` T03, T05  
`Included:` artifact-faithful AI page, suggested prompts, message rendering, conversation persistence, signed-in continuity, and public discovery access.  
`Excluded:` retrieval engine internals.  
`Acceptance:` the AI assistant looks and behaves like a real product surface rather than a prototype widget.

### T15 — Internal Retrieval, Citations, and AI-to-Draft Assist
`Refs:` CF6, CF7, PV, TP, AV | `Depends:` T06, T10, T11, T14  
`Included:` internal retrieval pipeline, vector-backed search, provider abstraction, citation formatting, public-safe evidence selection, and member-only challenge-draft generation from chat.  
`Excluded:` external web research answers.  
`Acceptance:` AI answers cite only allowed internal records and signed-in users can turn chat context into editable draft submissions.

### T16 — Public Analytics Intelligence Surface
`Refs:` CF9, PV, TP | `Depends:` T06, T07  
`Included:` public analytics page, aggregate charts, sector distribution, geography reach, challenge or solution activity trends, and recent public-safe platform signals.  
`Excluded:` admin moderation controls.  
`Acceptance:` analytics reads as a credible public intelligence product and exposes no non-public operational data.

### T17 — Admin Moderation, Taxonomy, and Governance Console
`Refs:` CF10, TP, AV | `Depends:` T05, T06, T10, T11, T13  
`Included:` challenge review, solution override controls, sector management, company governance, link oversight, and audit-friendly status actions.  
`Excluded:` broad BI or report-builder tooling.  
`Acceptance:` admins can govern content quality and trust without touching the public analytics surface.

## Phase 4 Quality and Sign-Off

### T18 — Responsive, Accessibility, and State Polish
`Refs:` EB, CF1-CF11, TP | `Depends:` T07-T17  
`Included:` mobile and tablet adaptation, keyboard and focus behavior, semantic structure, contrast checks, and complete loading, empty, error, and success states.  
`Excluded:` visual redesign beyond necessary adaptation.  
`Acceptance:` the app stays artifact-faithful on desktop while becoming usable and accessible across supported devices.

### T19 — Automated Test Coverage and Verification Harness
`Refs:` EB, CF1-CF10, TP | `Depends:` T07-T18  
`Included:` unit tests, integration tests, Playwright coverage for critical flows, fixtures or seeds, and pass or fail quality gates.  
`Excluded:` manual-only QA as the primary validation method.  
`Acceptance:` critical flows are covered across public, member, admin, AI, and relay behavior with reliable automated verification.

### T20 — Security Review, Docs Conformance, and Release Sign-Off
`Refs:` PV, TP, AV | `Depends:` T19  
`Included:` final security pass, RLS and privacy audit, docs-grounded verification against current library behavior, and cross-ticket consistency review.  
`Excluded:` new feature additions.  
`Acceptance:` there are no unresolved critical security or permissions issues, and the implementation matches the planned product and current stack guidance.
