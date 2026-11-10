import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { platformSettings } from '../db/schema/index.js';
import { requireRole } from '../middleware/auth.js';
import { seedDatabase } from '../db/seed.js';

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings
  app.get(
    '/api/settings',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
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

      return reply.send(settings);
    },
  );

  // PATCH /api/settings
  app.patch(
    '/api/settings',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;

      const updateData: any = { updatedAt: new Date() };
      if (body.platformName !== undefined) updateData.platformName = body.platformName;
      if (body.supportEmail !== undefined) updateData.supportEmail = body.supportEmail;
      if (body.allowedDomains !== undefined) updateData.allowedDomains = body.allowedDomains;
      if (body.sessionTimeoutMinutes !== undefined)
        updateData.sessionTimeoutMinutes = body.sessionTimeoutMinutes;
      if (body.maxFileUploadMb !== undefined) updateData.maxFileUploadMb = body.maxFileUploadMb;
      if (body.maintenanceMode !== undefined) updateData.maintenanceMode = body.maintenanceMode;

      await db.update(platformSettings).set(updateData).where(eq(platformSettings.id, 'default'));
      const updated = await db.query.platformSettings.findFirst({
        where: eq(platformSettings.id, 'default'),
      });

      return reply.send(updated);
    },
  );

  // POST /api/settings/reset-demo
  app.post(
    '/api/settings/reset-demo',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
    async (request, reply) => {
      await seedDatabase();
      return reply.send({ success: true, message: 'Demo data reseeded successfully' });
    },
  );
}
