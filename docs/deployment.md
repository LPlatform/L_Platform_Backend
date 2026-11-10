# Deployment

Staging and production use separate protected GitHub Environments. No OCI tenancy, region, registry, cluster or credentials were provided; deployment workflows therefore remain preparation only. Prefer GitHub OIDC federation, least privilege, and immutable image digests. Production requires explicit approval. Deploy API and judge independently; do not share API database credentials with the judge. Do not run migrations during application startup.
