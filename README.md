# NASQ NACIRE

`T01` through `T20` establish the current project foundation for the NASQ NACIRE build: the `Next.js` App Router scaffold, artifact-faithful design system, shared shell and route skeletons, the first Supabase schema and typed domain contracts, the auth or membership access layer, the initial RLS or public-read-model foundation, the first live public dashboard reads, the live challenge browse surface, the live challenge detail route, the verified-member challenge submission workflow, the verified-member solution publishing workspace, the live public solutions browse/detail experience, the protected anonymous relay workspace for member challenge response, the persisted AI assistant for both public discovery and signed-in continuity, the grounded citation plus AI-to-draft retrieval layer, the live public analytics intelligence surface, the protected admin governance console, the responsive or accessibility or route-state polish layer, the automated unit or integration or Playwright verification harness, the final release hardening pass, the post-`T20` showcase follow-up for public auth plus demo content fallback, and the new-user company onboarding flow for pending verification requests.

## Stack Baseline
- `Next.js 16.2.2`
- `React 19.2.4`
- `TypeScript 6.0.2`
- `@supabase/supabase-js 2.101.1`
- `@supabase/ssr 0.10.0`

## Local Setup
1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env.local`
3. Add Supabase credentials when later tickets require them
4. Set `NASQ_ENABLE_DEMO_DATA=true` in `.env.local` when you want client-showcase records on public pages before live data exists
5. Start the app with `npm run dev`

## Verification
- `npm test`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run test:coverage`
- `npm run test:verify`
- `npm run security:audit`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Current Scope
- App baseline, route groups, and safe Supabase boundaries are in place.
- Artifact design tokens and reusable UI primitives are in place.
- Public, member, and admin shell routes are materialized as skeleton pages.
- Core entity contracts live under `src/domain/`.
- The first database migration lives under `supabase/migrations/`.
- Server-side viewer resolution and route access rules live under `src/lib/auth/`.
- Public-safe read models and governed sector metadata now live under `src/domain/`.
- The public dashboard data layer now lives under `src/lib/data/` and reads from the public-safe SQL views introduced in `T06`.
- Public view row mappers and the challenge browse data layer now also live under `src/lib/data/`.
- The challenge detail data layer now also lives under `src/lib/data/` and resolves linked public solutions plus sector context by slug.
- Member challenge authoring now lives across `src/lib/challenges/`, `src/lib/data/`, `src/lib/actions/`, and `src/components/challenges/`.
- Member solution authoring and management now live across `src/lib/solutions/`, `src/lib/data/`, `src/lib/actions/`, and `src/components/solutions/`.
- Public solution browse and solution detail now also live under `src/lib/data/`, including provider-profile context inside the planned public solution surfaces.
- Member challenge management and anonymous relay now live across `src/lib/data/member-challenges.ts`, `src/lib/actions/relay-messaging.ts`, `src/lib/relay/`, and `src/components/challenges/`.
- AI continuity now lives across `src/lib/ai/`, `src/lib/data/ai-assistant.ts`, `src/lib/actions/ai-assistant.ts`, `src/components/ai/`, and `src/app/(public)/ai/`.
- AI grounding and member draft assist now also live across `src/lib/ai/service.ts`, `src/lib/actions/ai-draft-assist.ts`, and the new T15 guest-citation migration.
- Public analytics now also live across `src/lib/data/public-analytics.ts` and `src/app/(public)/analytics/`, including aggregate trends, geography reach, sector distribution, signal mix, and recent public-safe signals.
- Admin governance now also lives across `src/lib/data/admin-governance.ts`, `src/lib/actions/admin-governance.ts`, `src/components/admin/`, and the real `/admin/moderation`, `/admin/sectors`, `/admin/companies`, and `/admin/links` route surfaces.
- Shared loading and recovery states now also live across `src/components/shell/route-loading-state.tsx`, `src/components/shell/route-error-state.tsx`, route-group `loading.tsx` or `error.tsx` files, and the T18 shell or focus polish in `src/app/globals.css` plus `src/components/shell/`.
- T19 test harness coverage now also lives across `tests/integration/`, `tests/e2e/`, `playwright.config.ts`, and the `e2e:serve` or `test:verify` scripts, including redirect-safe server-action tests and fresh-server Playwright coverage for public, protected, and mobile shell behavior.
- T20 release hardening now also lives across `next.config.mjs`, `supabase/migrations/20260407003000_t20_security_hardening.sql`, `.planning/handoffs/05-release-signoff.md`, the `vite` override in `package.json`, and the new `security:audit` script.
- Public auth entry now also lives across `src/app/(public)/auth/`, `src/components/auth/`, and `src/lib/auth/actions.ts`, including sign-in, sign-up, sign-out, and safe redirect-back behavior for protected entry points.
- Demo showcase fallback data now also lives across `src/lib/demo/public-demo-content.ts`, `src/config/demo.ts`, and the public data loaders under `src/lib/data/`, including fourteen mixed public records for pagination, search, filtering, and detail-page walkthroughs.
- New-user company onboarding now also lives across `src/lib/auth/onboarding.ts`, `src/components/auth/account-onboarding-form.tsx`, `src/app/(member)/account/page.tsx`, and `supabase/migrations/20260407173000_post_t20_member_onboarding.sql`, including pending company-admin membership request creation under the existing RLS model.

## Next Step
Run a focused browser-level showcase audit of the full auth-to-verification flow, then capture any remaining artifact or onboarding gaps before the deployment pass.
