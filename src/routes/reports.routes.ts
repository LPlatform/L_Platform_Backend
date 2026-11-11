import { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { requireRole } from '../middleware/auth.js';

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
    'Student, section and teacher coverage for every class.',
    [
      { key: 'students', label: 'Students' },
      { key: 'sections', label: 'Sections' },
    ],
  ],
  [
    'allocation-statistics',
    'Course allocation statistics',
    'Course allocation counts and student reach.',
    [
      { key: 'allocations', label: 'Allocations' },
      { key: 'active', label: 'Active' },
    ],
  ],
  [
    'onboarding-statistics',
    'User onboarding statistics',
    'New student and teacher accounts.',
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

async function makeReports() {
  const organizations = await db.execute(
    sql`SELECT id, name, type, city, status FROM organizations ORDER BY name`,
  );
  const users = await db.execute(sql`SELECT id, organization_id, role, status FROM users`);
  const classes = await db.execute(sql`SELECT id, organization_id, name FROM classes`);
  const sections = await db.execute(sql`SELECT id, class_id FROM sections`);
  const allocations = await db.execute(sql`SELECT id, course_id, status FROM course_allocations`);
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
      rows = (organizations.rows as any[]).map((org) => {
        const members = (users.rows as any[]).filter(
          (u) => u.organization_id === org.id && u.role === role,
        );
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
      rows = (classes.rows as any[]).map((c) => ({
        key: c.id,
        label: c.name,
        secondary: (organizations.rows as any[]).find((o) => o.id === c.organization_id)?.name,
        values: {
          students: 0,
          sections: (sections.rows as any[]).filter((s) => s.class_id === c.id).length,
        },
      }));
    } else if (id === 'allocation-statistics') {
      rows = Array.from(new Set((allocations.rows as any[]).map((a) => a.course_id))).map(
        (courseId) => {
          const own = (allocations.rows as any[]).filter((a) => a.course_id === courseId);
          return {
            key: String(courseId),
            label: String(courseId),
            values: {
              allocations: own.length,
              active: own.filter((a) => a.status === 'ACTIVE').length,
            },
          };
        },
      );
    } else if (id === 'onboarding-statistics') {
      rows = [
        {
          key: 'all',
          label: 'All users',
          values: {
            students: (users.rows as any[]).filter((u) => u.role === 'STUDENT').length,
            teachers: (users.rows as any[]).filter((u) => u.role === 'TEACHER').length,
          },
        },
      ];
    } else {
      rows = ['ACTIVE', 'INACTIVE'].map((status) => ({
        key: status,
        label: status === 'ACTIVE' ? 'Active' : 'Inactive',
        values: {
          [status === 'ACTIVE' ? 'active' : 'inactive']: (organizations.rows as any[]).filter(
            (o) => o.status === status,
          ).length,
        },
      }));
    }
    return { id, title, description, columns, rows, generatedAt };
  });
}

export async function reportRoutes(app: FastifyInstance) {
  app.get(
    '/api/reports',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (_request, reply) => reply.send(await makeReports()),
  );
  app.get(
    '/api/reports/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const report = (await makeReports()).find((item) => item.id === id);
      if (!report) return reply.status(404).send({ message: 'Report not found' });
      return reply.send(report);
    },
  );
}
