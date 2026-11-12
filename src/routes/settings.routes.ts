import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { runWithRlsContext } from '../db/rls-context.js';
import { platformSettings } from '../db/schema/index.js';
import { requireRole } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';
import { isDemoResetAllowed } from '../lib/env.js';
import { Errors } from '../lib/errors.js';
import { getSupabaseStatus } from '../integrations/supabase.js';
import { getOciStatus } from '../integrations/oci.js';

const defaultPreferences = {
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  theme: 'system',
  notifications: {
    organizationCreated: true,
    invitationAccepted: true,
    allocationExpiring: true,
    weeklyDigest: false,
  },
  adminProfile: {
    firstName: 'Platform',
    lastName: 'Administrator',
    email: 'admin@lplatform.dev',
    jobTitle: 'Platform administrator',
  },
  sessionPreferences: { idleTimeoutMinutes: 60, requireReauthentication: false },
};

function toSettingsDto(
  row: NonNullable<Awaited<ReturnType<typeof db.query.platformSettings.findFirst>>>,
) {
  const saved = (row.preferences ?? {}) as Record<string, unknown>;
  return {
    ...defaultPreferences,
    ...saved,
    notifications: {
      ...defaultPreferences.notifications,
      ...((saved.notifications as object) ?? {}),
    },
    adminProfile: { ...defaultPreferences.adminProfile, ...((saved.adminProfile as object) ?? {}) },
    sessionPreferences: {
      ...defaultPreferences.sessionPreferences,
      ...((saved.sessionPreferences as object) ?? {}),
    },
    platformName: row.platformName,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings
  app.get(
    '/api/settings',
    { preHandler: [requireRole('PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN')] },
    async (request, reply) => {
      let settings = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'default'),
      });

      if (!settings) {
        await db.insert(platformSettings).values({ id: 'default' });
        settings = await db.query.platformSettings.findFirst({
          where: eq(platformSettings.id, 'default'),
        });
      }

      return reply.send(settings ? toSettingsDto(settings) : null);
    },
  );

  // PATCH /api/settings
  app.patch(
    '/api/settings',
    { preHandler: [requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;

      const updateData: any = { updatedAt: new Date() };
      const current = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'default'),
      });
      if (body.platformName !== undefined) updateData.platformName = body.platformName;
      updateData.preferences = {
        ...((current?.preferences as object) ?? {}),
        timezone: body.timezone,
        dateFormat: body.dateFormat,
        theme: body.theme,
        notifications: body.notifications,
        adminProfile: body.adminProfile,
        sessionPreferences: body.sessionPreferences,
      };

      await db.insert(platformSettings).values({ id: 'default' }).onConflictDoNothing();
      await db.update(platformSettings).set(updateData).where(eq(platformSettings.id, 'default'));
      const updated = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'default'),
      });

      return reply.send(updated ? toSettingsDto(updated) : null);
    },
  );

  // GET /api/platform/integrations/status
  app.get(
    '/api/platform/integrations/status',
    { preHandler: [requireRole('PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN')] },
    async (_request, reply) => {
      return reply.send({
        supabase: getSupabaseStatus(),
        oci: getOciStatus(),
        codeExecution: {
          status: 'DISABLED',
          reason:
            'Untrusted student code execution in API/Edge processes is intentionally disabled.',
        },
      });
    },
  );

  // GET /api/platform/roles
  app.get(
    '/api/platform/roles',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN'),
      ],
    },
    async (_request, reply) => {
      return reply.send([
        {
          id: 'PLATFORM_OWNER',
          label: 'Platform Owner',
          description:
            'Full multi-tenant platform administration, organization lifecycle, role management, content governance, settings, and audits.',
        },
        {
          id: 'PLATFORM_DEVELOPER',
          label: 'Platform Developer',
          description:
            'Platform-wide curriculum, question bank, integration health, and technical diagnostics without automatic access to student PII or submissions.',
        },
        {
          id: 'ORGANIZATION_ADMIN',
          label: 'Organization Admin',
          description:
            'Tenant-scoped management of organization users, teachers, students, classes, sections, course allocations, assessments, and reports.',
        },
        {
          id: 'TEACHER',
          label: 'Teacher',
          description:
            'Assigned-section authoring, question bank usage, assignment creation/publishing, manual assessment review, and grading.',
        },
        {
          id: 'STUDENT',
          label: 'Student',
          description:
            'Free platform course discovery, assigned class learning, assessment attempts, multi-type assignment submissions, and released results.',
        },
      ]);
    },
  );

  // POST /api/settings/reset-demo
  app.post(
    '/api/settings/reset-demo',
    { preHandler: [requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN')] },
    async (_request, reply) => {
      if (!isDemoResetAllowed()) {
        throw Errors.forbidden(
          'Demo data reset is disabled in this environment unless enabled explicitly in non-production.',
        );
      }
      await runWithRlsContext({ systemContext: 'SUPERUSER' }, () => seedDatabase());
      return reply.send({ success: true, message: 'Demo data reseeded successfully' });
    },
  );
}
