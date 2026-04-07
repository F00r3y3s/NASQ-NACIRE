# T20 Release Sign-Off

## Status
- Ticket: `T20 — Security Review, Docs Conformance, and Release Sign-Off`
- Date: `2026-04-07`
- Result: ready for deployment gating, with no unresolved critical security or permissions issues identified in the local codebase review

## Docs Grounding
- `Next.js 16.2.2` docs were re-checked for:
  - `next.config.js` `headers()`
  - `redirect()` and `unstable_rethrow()`
  - Server Action same-origin protection and `serverActions.allowedOrigins`
- `Supabase` docs were re-checked for:
  - `security definer` function hardening with `set search_path = ''`
  - explicit revoke or grant patterns for function execution
  - RLS and view behavior, including `security_invoker` guidance

## Hardening Applied
- Added baseline HTTP security headers in `next.config.mjs`
- Added mapper-level sanitization for public company website URLs before rendering
- Added explicit `noopener noreferrer` on public outbound provider links
- Added `20260407003000_t20_security_hardening.sql` to narrow function execution rights and remove the stale guest AI RPC overload
- Added `package.json` override for `vite@8.0.5`
- Added `npm run security:audit`

## Verification Results
- `npm run security:audit`
  - result: `found 0 vulnerabilities`
- `npm test`
  - result: `27` files passed, `92` tests passed
- `npm run build`
  - result: passed
- `npm run test:verify`
  - result: passed, including Playwright public or protected or mobile-shell coverage

## Residual Non-Critical Notes
- The new security-hardening migration has been created locally but not applied to a hosted Supabase project in this session.
- Repo-wide Vitest coverage remains below the aspirational `80%` target established in the planning package; the release harness is in place, but broader loader and admin-branch coverage can still improve later.
- Playwright verification requires launching Chromium outside the desktop sandbox in this environment, but the suite itself is stable and green once permitted.

## Deployment Readiness
- Safe to proceed to hosted migration application and release-candidate deployment.
