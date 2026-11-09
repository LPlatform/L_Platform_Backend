# GitHub settings and outstanding setup

Squash-only merging and read-only Actions defaults are enabled. GitHub returned `Upgrade to GitHub Pro or make this repository public` for the private repo branch-protection/ruleset APIs. Keep this repository private. The owner must upgrade the plan or apply an organization-level ruleset before `main` can require PRs/status checks, conversation resolution, linear history, and force-push/deletion protection.

Protect `backend-v*` release tags from update/deletion when the plan permits. Keep required approval count at zero for solo-owner merging. No branch or tag protection is active for this private repo. Require only status check names observed after product jobs run; do not require the skipped private security checks.

Dependabot alerts/security updates and read-only Actions defaults are enabled. Secret scanning, push protection, CodeQL and dependency review need eligible private-repository security licensing. The owner must provision OCI registry/target and OIDC trust, create protected staging/production Environments with production reviewers, then configure deployment steps. No credentials or target are present.
