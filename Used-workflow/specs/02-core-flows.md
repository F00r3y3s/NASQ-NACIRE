# NASQ NACIRE Core Flows

## Global UX Rule
All flows inherit the artifact HTML as the visual baseline: same light theme, typography direction, palette, premium dashboard feel, and six primary surfaces.

## 1. Public Discovery From Dashboard
A public visitor lands on the dashboard and sees platform activity, featured sectors, recent challenges, solution signals, and high-level analytics. They can move into challenge browsing, solution browsing, analytics, or the AI assistant without signing in.

## 2. Browse Challenges to Challenge Detail
A public user opens the challenges surface, filters by sector, searches by keyword, and opens a dedicated challenge detail page. The detail page shows public-safe metadata, geography, sector, status, and linked solutions where available.

## 3. Verified Member Challenge Submission
A verified company member opens the challenge submission flow, enters structured details, selects sector and geography, chooses public or anonymous visibility, and can save progress as a draft. On submission, the challenge moves into review.

## 4. Browse Solutions to Solution Detail
A public user browses published solutions and opens a dedicated solution detail page. Solutions stand alone as reusable records and may link to multiple relevant challenges.

## 5. Verified Member Solution Publishing
A verified company member creates a solution as its own record with structured metadata and optional challenge links. Verified-member solutions publish immediately in v1.

## 6. Public AI Discovery
A public user opens the AI assistant, asks a question about sectors, challenges, or solutions, and receives an answer grounded only in internal platform records with linked citations back to platform entities.

## 7. AI-to-Draft Assist for Members
A signed-in verified member can turn an AI conversation into a prefilled challenge draft and then edit the structured submission before final submit.

## 8. Anonymous Challenge Response Via Platform Relay
When a challenge is anonymous, verified members can still respond through a platform relay. The challenge owner stays hidden until the owner chooses otherwise.

## 9. Public Analytics Exploration
A public user opens analytics to understand sector distribution, challenge activity, growth signals, and public platform intelligence. This is a public product surface, not an admin console.

## 10. Admin Moderation and Governance
An admin reviews submitted challenges, manages taxonomy quality, oversees company trust and content integrity, and handles override actions. These flows live in protected admin routes.

## 11. Company Presence
Companies have simple public profiles in v1 that provide enough identity and trust context for non-anonymous participation without turning v1 into a full directory product.

## Locked Flow Rules
- Public users can browse, analyze, and use AI discovery without signing in.
- Only verified members can submit challenges or publish solutions.
- Challenges require review before publication.
- Solutions publish immediately for verified members in v1.
- Challenges and solutions remain separate reusable records.
- Anonymous challenge handling must preserve confidentiality across UI, data reads, relay, and AI retrieval.
- AI answers must be grounded in internal records and should cite what they use.
