import { FastifyInstance } from 'fastify';
import { eq, sql, and, desc, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  organizations,
  users,
  classes,
  courses,
  courseAllocations,
  assignments,
  submissions,
  studentSectionMemberships,
  teacherSectionMemberships,
  auditLogs,
  invitations,
} from '../db/schema/index.js';
import { authenticate, isPlatformDeveloperRole, isPlatformOwnerRole } from '../middleware/auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  // GET /api/dashboard/summary
  app.get('/api/dashboard/summary', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const isOwner = isPlatformOwnerRole(user.role);
    const isDev = isPlatformDeveloperRole(user.role);
    const orgId = user.organizationId;

    if (isDev) {
      const [platformCourses] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courses)
        .where(sql`organization_id IS NULL`);
      return reply.send({
        totalOrganizations: 0,
        activeOrganizations: 0,
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalCourses: platformCourses?.count || 0,
        totalSubmissions: 0,
        pendingInvitations: 0,
        totalAllocations: 0,
        activeAllocations: 0,
        systemHealth: 'HEALTHY',
      });
    }

    if (!isOwner && !orgId) {
      const [platformCourses] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courses)
        .where(sql`organization_id IS NULL`);
      return reply.send({
        totalOrganizations: 0,
        activeOrganizations: 0,
        totalUsers: 1,
        totalStudents: user.role === 'STUDENT' ? 1 : 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalCourses: platformCourses?.count || 0,
        totalSubmissions: 0,
        pendingInvitations: 0,
        totalAllocations: 0,
        activeAllocations: 0,
        systemHealth: 'HEALTHY',
      });
    }

    const orgCount = isOwner
      ? (await db.select({ count: sql<number>`count(*)::int` }).from(organizations))[0]?.count || 0
      : 1;

    const userCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(users);
    if (!isOwner && orgId) userCountQuery.where(eq(users.organizationId, orgId));
    const totalUsers = (await userCountQuery)[0]?.count || 0;

    const studentCountQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.role, 'STUDENT'),
          !isOwner && orgId ? eq(users.organizationId, orgId) : undefined,
        ),
      );
    const totalStudents = (await studentCountQuery)[0]?.count || 0;

    const teacherCountQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.role, 'TEACHER'),
          !isOwner && orgId ? eq(users.organizationId, orgId) : undefined,
        ),
      );
    const totalTeachers = (await teacherCountQuery)[0]?.count || 0;

    const activeOrgCount = isOwner
      ? (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(organizations)
            .where(eq(organizations.status, 'ACTIVE'))
        )[0]?.count || 0
      : 1;

    const pendingInvQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(
        and(
          eq(invitations.status, 'PENDING'),
          !isOwner && orgId ? eq(invitations.organizationId, orgId) : undefined,
        ),
      );
    const pendingInvitations = (await pendingInvQuery)[0]?.count || 0;

    const totalAllocQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseAllocations)
      .where(!isOwner && orgId ? eq(courseAllocations.organizationId, orgId) : undefined);
    const totalAllocations = (await totalAllocQuery)[0]?.count || 0;

    const activeAllocQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseAllocations)
      .where(
        and(
          eq(courseAllocations.status, 'ACTIVE'),
          eq(courseAllocations.accessEnabled, true),
          !isOwner && orgId ? eq(courseAllocations.organizationId, orgId) : undefined,
        ),
      );
    const activeAllocations = (await activeAllocQuery)[0]?.count || 0;

    const classCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(classes);
    if (!isOwner && orgId) classCountQuery.where(eq(classes.organizationId, orgId));
    const totalClasses = (await classCountQuery)[0]?.count || 0;

    const courseCountQuery = db.select({ count: sql<number>`count(*)::int` }).from(courses);
    if (!isOwner && orgId) courseCountQuery.where(eq(courses.organizationId, orgId));
    const totalCourses = (await courseCountQuery)[0]?.count || 0;

    const totalSubmissions = isOwner
      ? (await db.select({ count: sql<number>`count(*)::int` }).from(submissions))[0]?.count || 0
      : (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(eq(assignments.organizationId, orgId!))
        )[0]?.count || 0;

    return reply.send({
      totalOrganizations: orgCount,
      activeOrganizations: activeOrgCount,
      totalUsers,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalCourses,
      totalSubmissions,
      pendingInvitations,
      totalAllocations,
      activeAllocations,
      systemHealth: 'HEALTHY',
    });
  });

  // GET /api/dashboard/teacher
  app.get('/api/dashboard/teacher', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (isPlatformDeveloperRole(user.role) || user.role === 'STUDENT') {
      return reply
        .status(403)
        .send({ message: 'Teacher dashboard is not accessible for this role' });
    }

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
      if (
        isPlatformDeveloperRole(user.role) ||
        (!isPlatformOwnerRole(user.role) && !user.organizationId)
      ) {
        return reply.send([]);
      }
      const month = sql`date_trunc('month', ${users.createdAt})`;
      const rows = await db
        .select({
          label: sql<string>`to_char(${month}, 'Mon YYYY')`,
          value: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(
          and(
            eq(users.role, 'STUDENT'),
            !isPlatformOwnerRole(user.role) && user.organizationId
              ? eq(users.organizationId, user.organizationId)
              : undefined,
          ),
        )
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
      if (
        isPlatformDeveloperRole(user.role) ||
        (!isPlatformOwnerRole(user.role) && !user.organizationId)
      ) {
        return reply.send([]);
      }
      const rows = await db
        .select({ label: organizations.status, value: sql<number>`count(*)::int` })
        .from(organizations)
        .where(
          isPlatformOwnerRole(user.role) ? undefined : eq(organizations.id, user.organizationId!),
        )
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
      const user = request.user!;
      if (user.role === 'STUDENT' || isPlatformDeveloperRole(user.role)) {
        return reply.send([]);
      }
      if (!isPlatformOwnerRole(user.role) && !user.organizationId) {
        return reply.send([]);
      }
      const logs = await db.query.auditLogs.findMany({
        where:
          !isPlatformOwnerRole(user.role) && user.organizationId
            ? eq(auditLogs.organizationId, user.organizationId)
            : undefined,
        limit: 10,
        orderBy: desc(auditLogs.createdAt),
      });
      return reply.send(logs);
    },
  );
}
