import { FastifyInstance } from 'fastify';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  classes,
  courseAllocations,
  courses,
  organizations,
  sections,
  studentSectionMemberships,
  users,
} from '../db/schema/index.js';
import { isPlatformOwnerRole, requireRole } from '../middleware/auth.js';

const definitions = [
  [
    'organization-students',
    'Organization-wise student count',
    'Student membership by organization, split by account status.',
    [
      { key: 'students', label: 'Students' },
      { key: 'active', label: 'Active' },
      { key: 'inactive', label: 'Inactive' },
    ],
  ],
  [
    'organization-teachers',
    'Organization-wise teacher count',
    'Teacher membership by organization.',
    [
      { key: 'teachers', label: 'Teachers' },
      { key: 'active', label: 'Active' },
      { key: 'inactive', label: 'Inactive' },
    ],
  ],
  [
    'class-distribution',
    'Class-wise student distribution',
    'Student and section coverage for every class.',
    [
      { key: 'students', label: 'Students' },
      { key: 'sections', label: 'Sections' },
    ],
  ],
  [
    'allocation-statistics',
    'Course allocation statistics',
    'Course allocation counts and active availability.',
    [
      { key: 'allocations', label: 'Allocations' },
      { key: 'active', label: 'Active' },
    ],
  ],
  [
    'onboarding-statistics',
    'User onboarding statistics',
    'Student and teacher accounts.',
    [
      { key: 'students', label: 'Students' },
      { key: 'teachers', label: 'Teachers' },
    ],
  ],
  [
    'organization-status',
    'Active and inactive organizations',
    'Organization status distribution.',
    [
      { key: 'active', label: 'Active' },
      { key: 'inactive', label: 'Inactive' },
    ],
  ],
] as const;

async function makeReports(scopedOrgId: string | null) {
  const [orgRows, userRows, classRows, sectionRows, allocationRows, courseRows] = await Promise.all(
    [
      scopedOrgId
        ? db.select().from(organizations).where(eq(organizations.id, scopedOrgId))
        : db.select().from(organizations),
      scopedOrgId
        ? db.select().from(users).where(eq(users.organizationId, scopedOrgId))
        : db.select().from(users),
      scopedOrgId
        ? db.select().from(classes).where(eq(classes.organizationId, scopedOrgId))
        : db.select().from(classes),
      db.select({ id: sections.id, classId: sections.classId }).from(sections),
      scopedOrgId
        ? db
            .select()
            .from(courseAllocations)
            .where(eq(courseAllocations.organizationId, scopedOrgId))
        : db.select().from(courseAllocations),
      db.select({ id: courses.id, title: courses.title }).from(courses),
    ],
  );

  const classIds = new Set(classRows.map((c) => c.id));
  const relevantSections = sectionRows.filter((s) => classIds.has(s.classId));
  const relevantSectionIds = relevantSections.map((s) => s.id);
  const membershipRows = relevantSectionIds.length
    ? await db
        .select({
          sectionId: studentSectionMemberships.sectionId,
          studentId: studentSectionMemberships.studentId,
        })
        .from(studentSectionMemberships)
        .where(
          and(
            inArray(studentSectionMemberships.sectionId, relevantSectionIds),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        )
    : [];

  const orgById = new Map(orgRows.map((o) => [o.id, o]));
  const courseById = new Map(courseRows.map((c) => [c.id, c.title]));
  const generatedAt = new Date().toISOString();

  return definitions.map(([id, title, description, columns]) => {
    let rows: Array<{
      key: string;
      label: string;
      secondary?: string;
      values: Record<string, number | string>;
    }> = [];

    if (id === 'organization-students' || id === 'organization-teachers') {
      const role = id === 'organization-students' ? 'STUDENT' : 'TEACHER';
      rows = orgRows
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((org) => {
          const members = userRows.filter((u) => u.organizationId === org.id && u.role === role);
          return {
            key: org.id,
            label: org.name,
            secondary: [org.type, org.city].filter(Boolean).join(' · '),
            values: {
              [id === 'organization-students' ? 'students' : 'teachers']: members.length,
              active: members.filter((u) => u.status === 'ACTIVE').length,
              inactive: members.filter((u) => u.status !== 'ACTIVE').length,
            },
          };
        });
    } else if (id === 'class-distribution') {
      rows = classRows.map((c) => {
        const secIds = new Set(relevantSections.filter((s) => s.classId === c.id).map((s) => s.id));
        const studentCount = new Set(
          membershipRows.filter((m) => secIds.has(m.sectionId)).map((m) => m.studentId),
        ).size;
        return {
          key: c.id,
          label: c.name,
          secondary: orgById.get(c.organizationId)?.name,
          values: {
            students: studentCount,
            sections: secIds.size,
          },
        };
      });
    } else if (id === 'allocation-statistics') {
      rows = Array.from(new Set(allocationRows.map((a) => a.courseId))).map((courseId) => {
        const own = allocationRows.filter((a) => a.courseId === courseId);
        return {
          key: String(courseId),
          label: courseById.get(String(courseId)) || String(courseId),
          values: {
            allocations: own.length,
            active: own.filter((a) => a.status === 'ACTIVE').length,
          },
        };
      });
    } else if (id === 'onboarding-statistics') {
      rows = [
        {
          key: scopedOrgId || 'all',
          label: scopedOrgId ? orgById.get(scopedOrgId)?.name || 'Organization' : 'All users',
          values: {
            students: userRows.filter((u) => u.role === 'STUDENT').length,
            teachers: userRows.filter((u) => u.role === 'TEACHER').length,
          },
        },
      ];
    } else {
      rows = ['ACTIVE', 'INACTIVE'].map((status) => ({
        key: status,
        label: status === 'ACTIVE' ? 'Active' : 'Inactive',
        values: {
          [status === 'ACTIVE' ? 'active' : 'inactive']: orgRows.filter((o) => o.status === status)
            .length,
        },
      }));
    }
    return { id, title, description, columns, rows, generatedAt };
  });
}

function resolveReportScope(
  user: { role: any; organizationId: string | null },
  requestedOrgId?: string,
): { orgId: string | null; empty: boolean } {
  if (isPlatformOwnerRole(user.role)) {
    const clean = requestedOrgId?.trim();
    return { orgId: clean && clean !== 'ALL' ? clean : null, empty: false };
  }
  if (!user.organizationId) {
    return { orgId: null, empty: true };
  }
  return { orgId: user.organizationId, empty: false };
}

export async function reportRoutes(app: FastifyInstance) {
  app.get(
    '/api/reports',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as { organizationId?: string };
      const scope = resolveReportScope(request.user!, query.organizationId);
      if (scope.empty) {
        return reply.send([]);
      }
      return reply.send(await makeReports(scope.orgId));
    },
  );

  app.get(
    '/api/reports/onboarding-series',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as { organizationId?: string };
      const scope = resolveReportScope(request.user!, query.organizationId);
      if (scope.empty) {
        return reply.send([]);
      }

      const monthExpr = sql`date_trunc('month', ${users.createdAt})`;
      const rows = await db
        .select({
          monthKey: sql<string>`to_char(${monthExpr}, 'YYYY-MM')`,
          month: sql<string>`to_char(${monthExpr}, 'Mon YYYY')`,
          role: users.role,
          count: sql<number>`count(*)::int`,
        })
        .from(users)
        .where(
          and(
            inArray(users.role, ['STUDENT', 'TEACHER']),
            scope.orgId ? eq(users.organizationId, scope.orgId) : undefined,
          ),
        )
        .groupBy(monthExpr, users.role)
        .orderBy(monthExpr);

      const grouped = new Map<string, { month: string; students: number; teachers: number }>();
      for (const row of rows) {
        const entry = grouped.get(row.monthKey) ?? {
          month: row.month,
          students: 0,
          teachers: 0,
        };
        if (row.role === 'STUDENT') entry.students += row.count;
        if (row.role === 'TEACHER') entry.teachers += row.count;
        grouped.set(row.monthKey, entry);
      }
      return reply.send(Array.from(grouped.values()));
    },
  );

  app.get(
    '/api/reports/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const query = request.query as { organizationId?: string };
      const scope = resolveReportScope(request.user!, query.organizationId);
      if (scope.empty) {
        return reply.status(404).send({ message: 'Report not found' });
      }
      const report = (await makeReports(scope.orgId)).find((item) => item.id === id);
      if (!report) return reply.status(404).send({ message: 'Report not found' });
      return reply.send(report);
    },
  );
}
