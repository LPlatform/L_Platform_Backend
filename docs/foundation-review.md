# Foundation PR review — Backend

Review date: 2026-11-09. Reviewed PR #1's complete diff, all workflow YAML, repo docs/tests and available GitHub settings. The PR remains open and unmerged.

## Findings and changes

| Priority | Finding | Disposition |
|---|---|---|
| Critical | API tests, migration checks and Docker build reported success when their project inputs were absent. | Added readiness jobs and separate product jobs. API/migration/image checks now appear `skipped` when no package, migration system or Dockerfile exists. Once initialized, missing lockfiles/scripts fail. |
| Critical | Release used a mutable `lplatform-backend:release` image reference, lacked a release artifact, and used `TAG` in a step without setting it there. | Release now sets the tag globally, validates SemVer and `main` ancestry, refuses an existing GitHub Release, runs unit/integration/migration/build checks and Trivy, builds under the commit SHA, and attaches a saved image, image ID and SHA-256 file. OCI publication remains unconfigured. |
| Important | Workflow-wide release write permission was broader than needed. | Build and validation jobs are read-only; only the final release job receives `contents: write` and `actions: read`. Release runs are serialized. |
| Important | Docker build skipped inside a passing job and used a mutable CI tag. | The image job is now visibly skipped without a Dockerfile; a configured build uses the commit SHA and Trivy scans CRITICAL/HIGH vulnerabilities. |
| Important | OpenAPI “publication” was only a 90-day commit artifact and did not connect to a SemVer release. | CI artifact remains explicitly commit-scoped; release attaches a linted spec as `openapi-backend-vX.Y.Z.yaml` when one exists. Durable consumer access is still a manual architecture decision. |
| Improvement | No Node pin/cache or concurrency existed on several checks. | Added `.nvmrc` (24.22.1), pnpm lockfile caching, and cancellation/serialization appropriate to check vs release/deploy workflows. PostgreSQL service now uses the patch/codename tag `16.15-bookworm`. |
| Improvement | Bootstrap tests and product/API/migration tests were conflated. | Bootstrap is named separately and runs policy-only tests. Unit, integration and database checks are distinct jobs. |

All third-party Actions use full SHA pins. YAML and pin validation and the bootstrap Node smoke tests are run locally. No NestJS package, ORM, migration, Dockerfile, OpenAPI source or judge exists. Therefore API/database/product builds, container build/scan and contract lint have not run. No sandbox-security claim is made. `actionlint` and local Rust are unavailable; Docker Desktop was not responding locally.

## Release/security readiness

The release currently exports a commit-addressed Docker save tar, image ID and checksum; it does not publish an OCI image or track a registry manifest digest. No registry, OIDC, OCI target or credentials exist. No automatic version-bump/changelog PR is configured; GitHub release notes are generated, while `CHANGELOG.md` is reviewed manually. The CI PostgreSQL service is version-tagged but not digest-pinned.

GitHub blocked private-repo branch-protection/ruleset APIs with “Upgrade to GitHub Pro or make this repository public.” No `main` or `backend-v*` tag protection is active. Keep the repository private; owner action is plan upgrade or organization policy. Private CodeQL and dependency review require eligible GitHub Code Security licensing. Dependabot alerts/security updates and read-only Actions defaults are enabled.

No deployment occurs. Before activating it, the owner must provide OCI target/registry, OIDC trust, migration/recovery plan, protected staging/production Environments, production reviewers and allowed refs. The deployment workflows are `main`-only preparation gates and currently fail safely because no target is configured.

Verified PR head `92a1861`: `bootstrap-smoke` passed; backend product CI, API integration, migrations, Docker/Trivy, OpenAPI validation, CodeQL and dependency review were explicitly skipped where their source/configuration was absent. Readiness gates completed. The PR status is clean. No product build/test/image is claimed. The report-only follow-up commit also reruns bootstrap CI.
