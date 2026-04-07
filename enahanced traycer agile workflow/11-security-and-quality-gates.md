# Security and Quality Gates

## Security Gates
- no hardcoded secrets
- validation at system boundaries
- permission checks at the server and database layer
- privacy-safe handling of masked or anonymous data
- safe AI retrieval and prompt construction

## Quality Gates
- TDD for feature work
- unit, integration, and end-to-end tests where appropriate
- artifact fidelity checks for important UI surfaces
- explicit loading, empty, error, and success states

## Release Gate
Do not call a phase complete if there are unresolved critical security, permission, or data-leak risks.
