# Reference Repo Patterns

## Repositories Reviewed
- `gstack`
- `superpowers`
- `gsd-build/get-shit-done`
- `docmancer`

## Patterns Worth Keeping

### From gstack
- research before building
- stronger product and QA review posture
- serious execution quality bar

### From superpowers
- invest in planning before coding
- break work into implementation-safe units
- keep TDD and verification close to feature delivery

### From gsd
- preserve context through memory and handoff files
- phase work cleanly so progress survives thread changes
- use execution loops that reduce drift and rework

### From docmancer
- ground implementation in current official docs
- do not trust stale memory for library behavior
- treat docs lookup as a build-time guardrail

## How These Influenced This Project
- planning is more rigorous than raw Traycer alone
- implementation tickets are bounded and explicit
- handoff quality is a first-class deliverable
- docs-grounding is built into execution rules rather than postponed
