# L_Platform Backend

Private repository for APIs, persistence, workers, judge services and cloud infrastructure. This repository contains an engineering foundation only; no business modules are implemented.

## Stack and boundaries

Planned stack: Node.js, NestJS, TypeScript, PostgreSQL, the ORM selected by the project, Docker, OCI and OpenAPI. Any judge must run as a separately deployed, isolated process. Never execute untrusted programs in API jobs or share API database credentials with a judge sandbox.

Use short lived branches (`feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*`, `security/*`), PRs to `main`, Conventional Commits and squash merges. See [repository audit](docs/repository-audit.md), [GitHub Actions](docs/github-actions.md) and [API contracts](docs/integration/api-contracts.md). Do not commit secrets, production data or `.env*` files.
