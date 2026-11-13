# L Platform — Backend API

Fastify + TypeScript + Drizzle API on PostgreSQL (Supabase in production). Serves the web portal (admins, organization admins, teachers) and the student desktop app.

## What it does

- Auth with short-lived JWT (HttpOnly cookies for the web, bearer tokens for the desktop app) and rotating refresh tokens.
- Roles: `PLATFORM_OWNER`, `PLATFORM_DEVELOPER`, `ORGANIZATION_ADMIN`, `TEACHER`, `STUDENT`.
- Organizations, classes, sections, enrolment, course allocation, invitations, reports, audit log, settings.
- Teachers create **MCQ (single/multi), short/long answer and coding** questions, build assignments and assessments, review and release grades.
- Coding submissions are stored as `PENDING` for teacher review (no code is executed by the API).

## Security model

Two layers, both required:

1. **Route guards** — `authenticate` + `requireRole(...)` and per-resource checks (same organization, teacher-of-section, own records).
2. **PostgreSQL row-level security** — every table has RLS `FORCE`d. Each request runs in a transaction that does `SET LOCAL ROLE lplatform_app` (no `BYPASSRLS`) and sets `app.user_id`, `app.user_role`, `app.organization_id`, so the database itself blocks cross-tenant reads/writes.

`src/tests/integration/security-rls.test.ts` covers tenant isolation, privilege escalation, developer PII isolation, roster privacy and the teacher/student workflows.

## Run locally

```bash
pnpm install
pnpm db:migrate     # idempotent
pnpm db:seed        # demo data (dev only)
pnpm dev            # http://localhost:3001, docs at /docs
```

Env vars come from the single workspace `.env` one folder up (`../.env`); see `.env.example` for the full list.

## Tests

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build
DATABASE_URL=postgresql://...test-db... pnpm test:integration   # needs a disposable Postgres
```

## Deploy (Vercel + Supabase)

1. **Supabase** → create a project → Settings → Database → copy the **Transaction pooler** connection string (port 6543). Remove any `?sslmode=...`.
2. **GitHub** → this repo → Settings → Environments → `production` → secrets: `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`. Run **Actions → Supabase DB Migrate** on `main` (tick _seed_ once only if you want demo data, then change those passwords).
3. **Vercel** → import this repo (framework: Other). `vercel.json` builds with `pnpm build` and serves `api/index.js`. Env vars:
   `DATABASE_URL`, `DATABASE_SSL=true`, `PG_POOL_MAX=3`, `NODE_ENV=production`, `JWT_SECRET`, `COOKIE_SECRET`,
   `CORS_ORIGIN=https://<web-domain>,tauri://localhost,http://tauri.localhost,https://tauri.localhost`.
4. Put the API URL in the web project's `BACKEND_URL` and in the desktop repo variable `VITE_API_URL`.

Migrations never run on app start. The demo seed refuses to run in production unless `ALLOW_PROD_SEED=true`.

## Installer downloads

`GET /api/downloads/latest` returns the latest desktop version and installers per platform; `GET /api/downloads/latest/{windows|windows-msi|macos|linux|linux-deb}` redirects to a short-lived download URL. Release data comes from the app repo's GitHub Releases (cached 5 minutes). While that repo is private, set `GITHUB_RELEASES_TOKEN` (fine-grained, read-only Contents on that repo) in Vercel; it never leaves the server.

## Known limits

- No sandboxed code runner yet: coding answers are graded by teachers.
- Attachment uploads need OCI storage env vars (return `503` until set).
- Invitations are stored but no email is sent.
