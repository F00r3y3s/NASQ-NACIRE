# Decision Ledger

## Product Decisions
- Use `Next.js App Router + Supabase` as the v1 stack.
- Build all six public product surfaces in v1.
- Keep the artifact HTML as the visual source of truth.
- Use `public + verified member + admin` role boundaries.
- Keep `Challenge` and `Solution` as separate entities.
- Use dedicated detail pages rather than modal-only detail views.
- Ship English-first and Arabic-ready.

## AI Decisions
- AI is public-facing for discovery.
- AI is grounded only in internal platform data in v1.
- AI must cite platform records.
- Verified members can convert AI conversations into challenge drafts.
- Use a provider abstraction from day one.

## Submission and Moderation Decisions
- Challenges require review before publication.
- Verified-member solutions publish immediately in v1.
- Anonymous challenges use a platform relay response model.
- Company profiles are simple public profiles in v1.

## Taxonomy Decisions
- Include all artifact sectors plus `Police & Civil Defense`, `Aviation`, and `Solar & Energy`.
- Preserve sector blurbs as seed metadata when available.

## Execution Decisions
- Materialize planning docs before feature implementation.
- Use Docmancer-style official docs grounding during execution.
- Keep a reusable handoff layer under `.planning/`.
- Pin the T01 scaffold to `Next.js 16.2.2`, `React 19.2.4`, `TypeScript 6.0.2`, `@supabase/supabase-js 2.101.1`, and `@supabase/ssr 0.10.0`.
- Use the `proxy.ts` file convention and an explicit Turbopack root for the Next.js 16 scaffold.
- Keep the artifact font families as CSS stacks in T01 so the baseline builds cleanly without network-dependent font fetching.
- Keep design tokens global in `src/app/globals.css` and implement reusable UI primitives with scoped CSS Modules.
- Treat challenge cards, solution cards, stat cards, buttons, badges, pills, form controls, chart shells, and table shells as first-class reusable primitives for later tickets.
- Use a shared shell across public, member, and admin route groups so the fixed sidebar and topbar stay visually consistent with the artifact.
- Model primary navigation as the six artifact surfaces and use secondary tabs inside account and admin pages instead of redesigning the sidebar.
- Keep all T03 route pages data-static and structurally realistic so later tickets can swap in real queries without rebuilding page composition.
- Mirror `auth.users` into `public.profiles` with Supabase-style triggers so product data can reference a stable public user record without coupling the app to raw auth table reads.
- Model verified-member eligibility on `memberships.verification_status` and reserve `profiles.platform_role` for platform-level admin access.
- Keep `votes` solution-scoped in v1 and keep `analytics_events` append-only so engagement and intelligence surfaces stay explicit rather than generic or overloaded.
- Materialize the T04 domain contract in `src/domain/` and the first database migration in `supabase/migrations/` so later tickets can share the same typed entity and lifecycle vocabulary.
- Resolve the current viewer on the server from `profiles`, `memberships`, and `company_profiles`, then pass that serialized viewer state into the shared shell instead of relying on static placeholders.
- Protect authenticated routes in App Router layouts and keep the `proxy` focused on session refresh plus anonymous redirects for protected paths.
- Treat `/account` routes as authenticated workspace pages, `/submit` and `/drafts/[id]` as verified-member routes, and `/admin/*` routes as admin-only.
- Keep raw challenge, solution, relay, vote, AI, and analytics tables behind RLS, and expose public discovery through dedicated public-safe SQL views instead of direct table reads.
- Enforce anonymous challenge masking in the `public_challenges` read model so company identity never depends on page-level filtering.
- Seed governed sectors through migration-backed metadata and keep the reusable seed contract in `src/domain/sectors.ts` for later admin and browse features.
- Compose public dashboard data through a single server-side view-model layer in `src/lib/data/public-dashboard.ts` so page code stays presentation-focused while all public-view normalization and fallback states remain centralized.
- Normalize Supabase public-view rows through dedicated mapper functions in `src/lib/data/public-record-mappers.ts` before they enter camelCase domain read models.
- Implement challenge browse as a server-side GET-driven surface with `q`, `sector`, `sort`, and `page` search params so filtering, sorting, and pagination stay URL-addressable and cache-friendly in App Router.
- Implement challenge detail as a cached server-side fetch by slug that loads the primary public challenge first, then resolves linked solutions and sector context from public-safe views.
- Treat “missing configuration or query failure” separately from “slug not found” on public detail pages so local setup gaps render guidance instead of false 404s.
- Implement member challenge authoring as one shared editor across `/submit` and `/drafts/[id]`, backed by a single server action that distinguishes `save_draft` from `submit_for_review` by form intent.
- On submit, create or update a draft snapshot first, insert the challenge as `pending_review`, then lock the draft as `submitted` so the protected draft route remains the canonical post-submit checkpoint.
- Implement member solution authoring directly on `/account/solutions`, using the page as a combined create/edit workspace driven by the optional `?solution=` query param instead of adding an unplanned member route.
- Preserve solution ownership on edit by loading the existing solution row server-side and updating it in place; require verified company membership only for new solution publication, not to reassign ownership during edits.
- Deliver v1 public company presence through provider profile panels inside the planned `/solutions` and `/solutions/[slug]` surfaces instead of adding an unplanned public company route outside the locked route contract.
- Treat `public_solutions` as the source of truth for public solution detail fields, including offering description and provider identity, and load linked challenge plus provider context through public-safe views rather than raw table joins in page code.
- When the public solution detail route loses supporting provider, sector, or challenge-link context but still resolves the primary solution record, render a partial error state instead of reporting a false live success so the page stays honest about read-model health.
- Implement relay messaging inside the existing `/account/challenges` member workspace instead of adding an unplanned dedicated relay route, so authored challenge management and protected relay activity stay inside one planned surface.
- Start anonymous relay threads through security-definer Supabase RPC functions rather than app-side table inserts, because raw challenge ownership stays private behind RLS and should not be exposed to responders just to initiate a thread.
- Keep responder-side relay labels masked to `Anonymous challenge owner`, and only surface responder company identity indirectly through an explicitly linked public solution record when that context already exists.
- Implement T14 AI continuity as a persisted preview-mode assistant first, keeping retrieval and citations explicitly deferred to T15 instead of pretending grounded answers already exist.
- Preserve signed-in AI continuity in the raw `ai_conversations` and `ai_messages` tables behind existing RLS, but support public guest continuity through cookie-scoped security-definer RPC functions so anonymous discovery does not require weakening table policies.
- Implement T15 grounded AI retrieval against public-safe challenge and solution read models only, so citations and summaries inherit the same anonymity and visibility rules as the public UI.
- Preserve `ai_messages.citations` as the stored provenance contract for assistant answers, and reuse `challenge_drafts.source_conversation_id` when a verified member turns a saved thread into an editable challenge draft.
- Keep the AI provider boundary live from T15 onward, but fall back to a deterministic local provider when no external AI key is configured so grounded retrieval and draft assist still work in local development.
- Implement T16 analytics as a server-side view-model layer over the existing public-safe SQL views, rather than querying raw analytics tables or adding a separate BI schema before the public surface exists.
- Keep the public analytics windowing contract intentionally narrow to `7d` and `30d`, and build the activity chart from aggregate-safe challenge, solution, and signal counts instead of exposing any non-public operational metrics.
- Derive geography reach from public company profile footprint only, so the analytics surface stays credible without requiring new private location joins or weakening the public-read-model boundary.
- Implement T17 admin governance on top of the existing schema and RLS foundations first, using dedicated server actions and protected view models instead of adding a new admin API layer before the core moderation console exists.
- Use `analytics_events` as the lightweight governance activity feed for admin actions in v1, with admin-specific event names that stay out of the public analytics allowlist instead of introducing a separate audit table during T17.
- Keep company governance and membership trust review together on `/admin/companies`, and keep challenge-solution link oversight on `/admin/links`, so all planned admin routes become real protected workspaces without expanding the route contract.
- Implement T18 route-state polish with App Router `loading.tsx` and `error.tsx` boundaries at the route-group level, so public, member, and admin segments get immediate recovery-aware states without redesigning the shell.
- Treat global keyboard and focus behavior as a shared system concern in `globals.css` and the shell, including visible focus rings, reduced-motion support, and a skip link, instead of patching accessibility per page.
- Keep the top-bar search lightweight and route it into the existing `/challenges` discovery flow rather than introducing a new cross-surface search feature during polish.
- Preserve Next.js redirect semantics inside server actions by calling `unstable_rethrow(error)` at the top of catch blocks that may intercept `redirect()` so framework-controlled navigation is not swallowed by generic error handling.
- Run Playwright against a fresh built server on `http://127.0.0.1:3100` through the dedicated `e2e:serve` script by default, and only bypass the managed server when an explicit `PLAYWRIGHT_BASE_URL` is provided.
- Keep T19 integration coverage centered on critical server actions for challenge submission, solution publishing, relay messaging, AI continuity, and admin moderation, while using Playwright to verify public navigation, protected-route redirects, search handoff, and mobile-shell behavior.
- Add a T20 security-hardening migration that revokes default execute rights from sensitive helper or RPC functions, re-grants only the minimum required Supabase roles, and removes the obsolete five-argument guest AI RPC overload left behind by the T15 upgrade.
- Ship baseline release security headers from `next.config.mjs` for all routes, specifically `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy`, without introducing a brittle CSP during the final sign-off pass.
- Pin the transitive Vite dependency to `8.0.5` through `package.json` overrides and expose `npm run security:audit` as the repeatable dependency-vulnerability check for release readiness.
- Sanitize public company website URLs at the mapper boundary and keep external solution-detail links on `noopener noreferrer` so public rendering does not trust stored URLs blindly even if admin validation is bypassed.
- Rebuild the public dashboard route around the artifact’s exact hero, stat-card, recent-challenge, sector-glance, live-activity, and quick-action layout, even when some dashboard charts or ratios must be derived from the existing public-safe snapshot instead of dedicated historical BI tables.
- Restore the artifact’s `Do you already have a solution?` chooser inside `/submit`, but keep it as a routing handoff into `/account/solutions` rather than merging challenge submission, paid flows, or checkout into the v1 challenge contract.
- Extend public challenge browse with URL-addressable `status` filtering (`all`, `open`, `solved`) and expose a direct `Submit a Solution` CTA only on open challenges, routing guests through auth-first navigation and members into the existing solution workspace with challenge prefill.
- Keep `/challenges` focused on filtering and opening records, and move the durable `Submit a Solution` action onto `/challenges/[slug]` so every challenge detail page offers the same response entry point regardless of how many linked solutions already exist.
