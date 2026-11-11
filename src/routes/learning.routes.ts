import { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { courseAllocations, courses } from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { aiReadinessCourse } from '../content/ai-readiness.js';

export async function learningRoutes(app: FastifyInstance) {
  app.get('/api/learning/ai-readiness', { preHandler: [authenticate] }, async (request, reply) => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, 'crs-ai-readiness-001'),
    });
    if (!course || course.status !== 'PUBLISHED') {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Course not found' });
    }

    const user = request.user!;
    if (user.role !== 'PLATFORM_ADMIN') {
      if (!user.organizationId) {
        return reply
          .status(403)
          .send({ code: 'FORBIDDEN', message: 'Course access is not allocated' });
      }
      const allocation = await db.query.courseAllocations.findFirst({
        where: and(
          eq(courseAllocations.courseId, course.id),
          eq(courseAllocations.organizationId, user.organizationId),
          eq(courseAllocations.scope, 'ORGANIZATION'),
          eq(courseAllocations.status, 'ACTIVE'),
          eq(courseAllocations.accessEnabled, true),
        ),
      });
      if (!allocation) {
        return reply
          .status(403)
          .send({ code: 'FORBIDDEN', message: 'Course access is not allocated' });
      }
    }

    return reply.send(aiReadinessCourse);
  });
}
