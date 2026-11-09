# GitHub settings and outstanding setup

The account can administer this repository. Recommended squash-only merging is enabled. The private repository rulesets endpoint is unavailable under the current GitHub plan/visibility, so branch ruleset state could not be inspected or changed through that API. Do not change visibility as a workaround.

After CI has run on a PR, enable branch protection where supported: require PRs and observed CI checks, conversation resolution and linear history; block force pushes and branch deletion; use zero required approvals for solo-owner merging. If unavailable, upgrade the plan or apply equivalent organization controls. Require only status check names actually observed.

Enable dependency graph/Dependabot alerts, secret scanning and push protection in repository settings where supported. Use least-privilege Actions defaults. OCI OIDC trust, registry, environments and infrastructure are not provisioned; do not deploy until configured.
