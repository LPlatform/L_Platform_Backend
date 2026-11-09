# Release process

Use SemVer and `backend-vMAJOR.MINOR.PATCH` tags from approved `main` changes only after the full CI, database and image checks pass. Never overwrite a tag. Publish immutable image digests and attach generated notes. Keep production deployment separately gated by a protected Environment and explicit approval.

No package version source, ORM, migrations, image or OCI environment is configured yet. Select one version of record in the future package manifest. Migration execution must be a separately reviewed step; never run destructive migrations automatically in production. Roll back by deploying the prior immutable image digest and following a reviewed migration recovery plan. OCI and credentials are not configured.
