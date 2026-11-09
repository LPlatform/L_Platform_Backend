# GitHub Actions

Workflows are partitioned into CI, API tests, database/migration tests, Docker build, security, release, staging deploy, production deploy and OpenAPI contract validation/artifact packaging. They use least privilege and full SHA pins. CI must not treat absent tests or configuration as successful implementation checks.

At audit time no NestJS package, ORM, migrations, Dockerfile, judge, OCI registry, OpenAPI document or product test suite existed. Database isolation tests, clean/upgrade migration validation, image build/scan, contract validation and OCI workflows require these concrete project inputs. Current GitHub run: foundation checks pass; CodeQL and dependency review are unavailable on this private repository under the current plan. Production deploy remains gated by GitHub Environment approval and configured OIDC or secrets. Workflow files alone do not enable Dependabot alerts, secret scanning, push protection or CodeQL settings.
