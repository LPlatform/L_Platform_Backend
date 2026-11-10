# Engineering instructions

## Architecture
Private API, persistence, workers, judge and infrastructure repository. Planned stack: Node.js, NestJS, TypeScript, PostgreSQL, selected ORM, Docker, OCI and OpenAPI. No business modules are implemented as part of this foundation.

## Development and security rules
- Backend owns the versioned OpenAPI contract; web and desktop consume pinned published artifacts. Never share backend source with consumers.
- Keep the judge as a separately deployed execution boundary. Never run untrusted code in API processes/jobs or share API DB credentials with the judge. Do not claim sandbox security without adversarial tests.
- Use migrations reviewed and tested against clean and previous-supported test databases. Never automatically run destructive migrations in production; separate migration execution from app startup.
- Use short lived `feature/*`, `fix/*`, `refactor/*`, `chore/*`, `docs/*` or `security/*` branches. PRs target `main`; Conventional Commits and squash merges. Never force push, rewrite history, bypass checks or commit directly to `main`.
- Add tests for authorization, tenant isolation, validation and failure cases as features arrive. Missing suites are readiness gaps.
- CI uses least privilege, pinned Actions, frozen lockfiles and no secrets on fork PRs. OCI deployment uses OIDC when configured, immutable image digests and protected environments.
- Releases use independent `backend-vX.Y.Z` tags after successful checks. Codex must inspect first, preserve user changes, never expose secrets, and report unrun checks accurately.
