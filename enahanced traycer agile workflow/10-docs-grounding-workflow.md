# Docs Grounding Workflow

## Principle
Use current official documentation during implementation instead of relying on memory for framework and library behavior.

## Workflow
1. Identify the libraries touched by the ticket.
2. Check current official docs before implementation.
3. Record any version-specific constraints.
4. Implement using current guidance.
5. Re-check critical integration points during verification.

## Why This Matters
- reduces outdated patterns
- improves security and compatibility
- makes implementation more predictable

## Typical Targets
- framework routing and rendering
- auth and session handling
- database policies
- SDK usage
- validation libraries
- charting or UI library APIs
