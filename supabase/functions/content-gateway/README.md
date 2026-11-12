# L_Platform Hybrid Architecture — Supabase & OCI Integration

This directory holds the deployment blueprints and Edge Function gateway for running L_Platform across the approved hybrid topology:

1. **Supabase Auth + Supabase PostgreSQL (`supabase/migrations/20261111000001_hybrid_architecture_and_rls.sql`)**
   - Authoritative identity across Web Portal and Tauri Windows Student Desktop App.
   - Student data: `lplatform.profiles`, `lplatform.section_memberships`, `lplatform.lesson_progress`, `lplatform.assessment_attempts`, and `lplatform.submissions` protected with `ENABLE` + `FORCE ROW LEVEL SECURITY`.
   - `PLATFORM_DEVELOPER` is explicitly prevented by RLS from reading student PII, organization rosters, attempts, or submissions.

2. **Supabase Edge Functions (`supabase/functions/content-gateway/index.ts`)**
   - Verifies caller Bearer JWTs via Supabase Auth `/auth/v1/user`.
   - Enforces free `PLATFORM_FREE` eligibility (`crs-ai-readiness-001`) and tenant/role boundaries before proxying published immutable curriculum snapshots from OCI PostgreSQL or authorizing scoped private OCI Object Storage uploads/downloads.
   - Never exposes `SUPABASE_SERVICE_ROLE_KEY`, `OCI_PRIVATE_KEY`, or OCI PostgreSQL credentials to browser or desktop clients, and never executes untrusted student code.

3. **Express/Fastify Backend Runtime Integration (`src/integrations/supabase.ts` & `src/integrations/oci.ts`)**
   - `GET /api/settings/integrations` reports live configuration status for Supabase Auth and OCI Object Storage / Content DB without returning any secret values.
   - Submission file attachments use scoped OCI Object Storage keys (`POST /api/submissions/attachment-upload` and `GET /api/submissions/:id/attachment-download`) and fail closed (`503 OCI_NOT_CONFIGURED`) when OCI storage credentials are not provisioned.
