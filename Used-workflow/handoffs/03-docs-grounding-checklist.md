# Docs Grounding Checklist

Use this checklist at the start of any implementation ticket that touches framework or library behavior.

## Required Workflow
1. Identify the exact library or framework touched by the ticket.
2. Check current official docs before implementation for APIs, patterns, and constraints.
3. Record any version-specific behaviors that affect the ticket.
4. Implement using current guidance, not memory.
5. Re-check critical integration points during verification.

## Priority Areas for This Project
- Next.js App Router patterns
- Supabase auth and SSR client handling
- Supabase row-level security and Postgres policies
- Vector-backed retrieval patterns
- Charting library integration
- Form validation and schema handling
- AI provider SDK and streaming patterns, if used

## Why This Exists
This project explicitly incorporates Docmancer-style docs grounding so the implementation stays current, secure, and compatible with the real stack.
