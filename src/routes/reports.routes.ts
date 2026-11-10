import { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users, organizations, classes, courses, submissions } from '../db/schema/index.js';
import { requireRole } from '../middleware/auth.js';

export async function reportRoutes(app: FastifyInstance) {
  // GET /api/reports
  app.get(
    '/api/reports',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      return reply.send([
        {
          id: 'user-activity',
          title: 'User Activity Report',
          description:
            'Summary of user logins, role distributions, and status changes across organizations.',
          category: 'Users',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'organization-enrollment',
          title: 'Organization Enrollment Report',
          description: 'Detailed metrics on schools, classes, and student enrollment trends.',
          category: 'Academic',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'course-utilization',
          title: 'Course Utilization & Completion',
          description:
            'Tracks course allocations, assignment submissions, and student performance scores.',
          category: 'Courses',
          updatedAt: new Date().toISOString(),
        },
      ]);
    },
  );

  // GET /api/reports/:id
  app.get(
    '/api/reports/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const totalUsers =
        (await db.select({ count: sql<number>`count(*)::int` }).from(users))[0]?.count || 0;
      const totalStudents =
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(sql`role = 'STUDENT'`)
        )[0]?.count || 0;
      const totalTeachers =
        (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(sql`role = 'TEACHER'`)
        )[0]?.count || 0;
      const totalSubmissions =
        (await db.select({ count: sql<number>`count(*)::int` }).from(submissions))[0]?.count || 0;

      return reply.send({
        id,
        title: id.replace('-', ' ').toUpperCase(),
        generatedAt: new Date().toISOString(),
        metrics: {
          totalUsers,
          totalStudents,
          totalTeachers,
          totalSubmissions,
        },
        data: [
          { metric: 'Active Users', value: totalUsers },
          { metric: 'Enrolled Students', value: totalStudents },
          { metric: 'Active Teachers', value: totalTeachers },
          { metric: 'Completed Submissions', value: totalSubmissions },
        ],
      });
    },
  );
}
