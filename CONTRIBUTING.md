# Contributing

1. Create a short lived `feature/`, `fix/`, `refactor/`, `chore/`, `docs/` or `security/` branch.
2. Follow Conventional Commits (for example `fix(api): reject invalid input`).
3. Keep changes scoped; never commit secrets, local environment files, production data or generated dependencies.
4. Run formatting, lint, typecheck, unit/integration tests, migration validation and build where configured. Explain unavailable checks in the PR.
5. Open a PR to `main`, resolve conversations and wait for required CI. Squash merge is recommended. No force pushes or check bypasses.
6. Changes touching the judge require separate-boundary review and security tests; do not run untrusted code in API processes.

See [GitHub Actions](docs/github-actions.md), [API contracts](docs/integration/api-contracts.md) and [release process](docs/release-process.md).
