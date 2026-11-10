# L_Platform foundation review — combined report

Review date: 2026-11-09. Covers the open foundation PRs in Web #1, Backend #1 and Application #1. None is merged. No repository visibility was changed and no product development was started.

## Critical findings and resolutions

1. **Skipped product work looked green.** Web/backend CI, API/migration/Docker/OpenAPI workflows and desktop/Rust checks previously exited successfully when manifests or code were missing. They now report bootstrap smoke tests separately and gate product jobs as skipped. Once a manifest/source file exists, the corresponding job runs and fails on missing lockfiles/scripts/config. A skipped job is not a build/test success.
2. **Release publishing was unsafe/incomplete.** Web's tag variable was unavailable to its publish step, backend used mutable `:release`, and releases lacked verified artifacts/existing-release guards. Release jobs now validate tag syntax and `main` ancestry, run quality gates, refuse an existing GitHub Release, publish only after build jobs, and scope write permissions to publication. Web uploads `.next`; backend attaches a commit-addressed Docker tar/image ID/checksum plus a version-named OpenAPI spec when present; desktop requires actual Windows/Linux installer files and attaches SHA-256 checksums.
3. **Desktop branch protection check contexts were incorrect.** Rules required workflow display names, while GitHub status checks use job names. The requirements were changed to exact job/matrix names and will be rechecked on the new PR head.
4. **Existing desktop release tags could be changed.** A tag ruleset now blocks update/deletion for `app-v*`. Private-repo tag rulesets could not be created under the account plan.
5. **Release/deployment authority was broad or insufficiently guarded.** Workflow defaults are read-only; release write access is confined to publish jobs. Deployment preparation is manual, main-only, serialized and contains no deployment command or credentials.

## Cross-repository design

- Backend remains the API-contract owner. Its workflow lints OpenAPI and uploads a commit-pinned CI artifact; a validated specification is attached to a backend SemVer release. No specification exists yet.
- Web and desktop docs require pinned generated contract versions. Neither consumer currently has an artifact fetch, client generation, or compatibility test; durable registry/access strategy is an owner decision. No backend source or private test entered the public desktop repository.
- Release tags are independent: `web-vX.Y.Z`, `backend-vX.Y.Z`, and `app-vX.Y.Z`. No product version manifest or automatic version-bump/changelog PR exists yet. GitHub release notes are generated; `CHANGELOG.md` files are manually reviewed.

## Workflow and build evidence

All `uses:` references are full SHA pins. YAML is parsed locally; no YAML syntax error was found after the review fixes. The Node bootstrap smoke suites verify governance boundaries and Action pins. On the reviewed code heads: Web `5499a4b` had `bootstrap-smoke` pass and product/security checks skip; Backend `92a1861` had bootstrap smoke pass, readiness checks complete, and API/database/container/OpenAPI product jobs skip; Application `d7bd9a1` had bootstrap smoke pass, readiness checks complete, and CodeQL/dependency-review/native/Rust product jobs skip. All three PRs report clean status after the corrections. No application production build, backend container build, migration run, installer, code signing or deployment was verified. Earlier green empty-product jobs are superseded and are not build evidence. `actionlint` was unavailable. Report-only follow-up commits trigger fresh smoke checks.

## Settings, gaps and owner actions

| Area | Web / Backend private repos | Application public repo |
|---|---|---|
| Squash merge / Actions token | Squash-only and read-only default permissions enabled | Same |
| Dependabot | Alerts and security updates enabled; weekly config present | Same |
| Branch protection | API returned “Upgrade to GitHub Pro or make this repository public.” No branch protection active. Keep visibility private; owner must upgrade or apply organization policy. | `main` protection active. Required check contexts were corrected; verify new head. Zero approvals preserve solo merge ability. |
| Release tag protection | Ruleset API returned same plan limitation; no tag protection active. Owner must upgrade or apply organization policy. Existing-release guards remain in workflows. | Active `app-v*` ruleset blocks tag update/deletion. |
| CodeQL/dependency review | Skipped; private-repo Code Security licensing required | Workflows skip until product source/lockfiles exist. Secret scanning and push protection are enabled. |
| Deploy approval/credentials | No target, OIDC, Environment reviewers or credentials. Owner must select OCI/host, create protected staging/production Environments, set reviewers/branch limits and configure secrets. | No signing/release Environment or credentials. Owner must configure protected release Environment and signing when ready. |

## Remaining release risks

- No production build can be verified until each product is initialized.
- Backend image is packaged as a local Docker save artifact; no OCI registry push or registry manifest digest tracking exists.
- OpenAPI CI artifact retention is 90 days; durable cross-repository distribution and consumer pinning are not configured.
- Version-of-record and automated changelog file generation remain undecided. GitHub-generated release notes are distinct from `CHANGELOG.md`.
- Private branch/tag protection and security feature licensing remain plan-gated; no visibility change was made.

PRs: [Web #1](https://github.com/LPlatform/L_Platform_Web/pull/1), [Backend #1](https://github.com/LPlatform/L_Platform_Backend/pull/1), [Application #1](https://github.com/LPlatform/L_Platform_Application/pull/1). Use each PR's latest status checks for final execution evidence; this report does not treat pre-review runs as validation of the review commits.
