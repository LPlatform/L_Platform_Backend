import { FastifyInstance } from 'fastify';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  organizations,
  users,
  classes,
  sections,
  courses,
  assignments,
  submissions,
  studentSectionMemberships,
  teacherSectionMemberships,
  auditLogs,
  invitations,
} from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/summary
  app.get('/api/dashboard/summary', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const isPlatformAdmin = user.role === 'PLATFORM_ADMIN';
    const orgId = user.organizationId;

    const orgCount = isPlatformAdmin
      ? (await db.select({ count: sql<number>`count(*)::int` }).from(organizations))[0]?.count || 0
      : 1;

    const userCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(users);
    if (!isPlatformAdmin && orgId) userCountQuery.where(eq(users.organizationId, orgId));
    const totalUsers = (await userCountQuery)[0]?.count || 0;

    const studentCountQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.role, 'STUDENT'),
          !isPlatformAdmin && orgId ? eq(users.organizationId, orgId) : undefined,
        ),
      );
    const totalStudents = (await studentCountQuery)[0]?.count || 0;

    const classCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(classes);
    if (!isPlatformAdmin && orgId) classCountQuery.where(eq(classes.organizationId, orgId));
    const totalClasses = (await classCountQuery)[0]?.count || 0;

    const courseCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(courses);
    if (!isPlatformAdmin && orgId) courseCountQuery.where(eq(courses.organizationId, orgId));
    const totalCourses = (await courseCountQuery)[0]?.count || 0;

    const subCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(submissions);
    const totalSubmissions = (await subCountQuery)[0]?.count || 0;

    return reply.send({
      totalOrganizations: orgCount,
      totalUsers,
      totalStudents,
      totalClasses,
      totalCourses,
      totalSubmissions,
      activeOrganizations: orgCount,
      systemHealth: 'HEALTHY',
    });
  });

  // GET /api/dashboard/teacher
  app.get('/api/dashboard/teacher', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;

    // Find sections assigned to this teacher
    const teacherSecs = await db
      .select({ sectionId: teacherSectionMemberships.sectionId })
      .from(teacherSectionMemberships)
      .where(
        and(
          eq(teacherSectionMemberships.teacherId, user.userId),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      );
    const secIds = teacherSecs.map((s) => s.sectionId);

    let assignedStudentCount = 0;
    let activeAssignmentsCount = 0;
    let pendingSubmissionsCount = 0;

    if (secIds.length > 0) {
      const studentRes = await db
        .select({ count: sql<number>`count(distinct student_id)::int` })
        .from(studentSectionMemberships)
        .where(
          and(
            inArray(studentSectionMemberships.sectionId, secIds),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        );
      assignedStudentCount = studentRes[0]?.count || 0;

      const asgRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(assignments)
        .where(and(inArray(assignments.sectionId, secIds), eq(assignments.status, 'PUBLISHED')));
      activeAssignmentsCount = asgRes[0]?.count || 0;

      const subRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(submissions)
        .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
        .where(inArray(assignments.sectionId, secIds));
      pendingSubmissionsCount = subRes[0]?.count || 0;
    }

    return reply.send({
      assignedSectionsCount: secIds.length,
      assignedStudentCount,
      activeAssignmentsCount,
      totalSubmissionsCount: pendingSubmissionsCount,
    });
  });

  // GET /api/dashboard/student-growth
  app.get(
    '/api/dashboard/student-growth',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      const month = sql`date_trunc('month', ${users.createdAt})`;
      const rows = await db
        .select({ label: sql<string>`to_char(${month}, 'Mon YYYY')`, value: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.role, 'STUDENT'),
          user.role !== 'PLATFORM_ADMIN' && user.organizationId
            ? eq(users.organizationId, user.organizationId)
            : undefined,
        ))
        .groupBy(month)
        .orderBy(month);
      return reply.send(rows);
    },
  );

  // GET /api/dashboard/organization-distribution
  app.get(
    '/api/dashboard/organization-distribution',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      const rows = await db
        .select({ label: organizations.status, value: sql<number>`count(*)::int` })
        .from(organizations)
        .where(user.role === 'PLATFORM_ADMIN' ? undefined : eq(organizations.id, user.organizationId!))
        .groupBy(organizations.status)
        .orderBy(organizations.status);
      return reply.send(rows);
    },
  );

  // GET /api/dashboard/recent-activity
  app.get(
    '/api/dashboard/recent-activity',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const logs = await db.query.auditLogs.findMany({
        limit: 10,
        orderBy: desc(auditLogs.createdAt),
      });
      return reply.send(logs);
    },
  );
}
