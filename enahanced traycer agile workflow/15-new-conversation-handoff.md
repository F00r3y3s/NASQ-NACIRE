# New Conversation Handoff

Use a fresh thread when you want clean implementation context after planning is complete.

## Fresh-Thread Checklist
1. Point the new thread to the formal spec files.
2. Point the new thread to the handoff files.
3. Point the new thread to the visual source of truth artifact.
4. Tell the new thread which ticket to start with.

## Example Prompt
```md
Continue this project from the finalized planning package.

Read first:
- docs/specs/01-epic-brief.md
- docs/specs/02-core-flows.md
- docs/specs/03-prd-validation.md
- docs/specs/04-tech-plan.md
- docs/specs/05-architecture-validation.md
- docs/specs/06-ticket-breakdown.md
- docs/specs/07-cross-artifact-validation.md
- .planning/handoffs/01-decision-ledger.md
- .planning/handoffs/02-implementation-rules.md
- .planning/handoffs/03-docs-grounding-checklist.md
- .planning/handoffs/04-execution-status.md

Visual source of truth:
- /absolute/path/to/artifact.html

Then start from T01 and continue in dependency order.
```

## Goal
The new thread should begin execution immediately without having to re-plan the product.
