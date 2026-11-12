import { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { courses } from '../db/schema/index.js';
import { authenticate, isPlatformDeveloperRole, isPlatformOwnerRole } from '../middleware/auth.js';
import { aiReadinessCourse } from '../content/ai-readiness.js';

export async function learningRoutes(app: FastifyInstance) {
  app.get('/api/learning/ai-readiness', { preHandler: [authenticate] }, async (request, reply) => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, 'crs-ai-readiness-001'),
    });
    const user = request.user!;
    const isPlatformStaff = isPlatformOwnerRole(user.role) || isPlatformDeveloperRole(user.role);
    if (!course) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Course not found' });
    }
    if (!isPlatformStaff && !['PUBLISHED', 'ACTIVE'].includes(course.status)) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Course not found' });
    }

    return reply.send({
      ...aiReadinessCourse,
      scopeType: 'PLATFORM_FREE',
      accessModel: course.accessModel || 'PLATFORM_FREE',
    });
  });
}
