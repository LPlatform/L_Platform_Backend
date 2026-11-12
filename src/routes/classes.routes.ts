import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  classes,
  sections,
  organizations,
  studentSectionMemberships,
  teacherSectionMemberships,
  courseAllocations,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  isPlatformOwnerRole,
  requireRole,
  checkTenantAccess,
} from '../middleware/auth.js';

async function getClassStats(classId: string) {
  const sectionRows = await db
    .select({ id: sections.id })
    .from(sections)
    .where(eq(sections.classId, classId));
  const sectionIds = sectionRows.map((section) => section.id);
  if (sectionIds.length === 0) {
    return { sectionCount: 0, studentCount: 0, teacherCount: 0, courseCount: 0 };
  }

  const [students, teachers, courses] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct student_id)::int` })
      .from(studentSectionMemberships)
      .where(
        and(
          inArray(studentSectionMemberships.sectionId, sectionIds),
          eq(studentSectionMemberships.status, 'ACTIVE'),
        ),
      ),
    db
      .select({ count: sql<number>`count(distinct teacher_id)::int` })
      .from(teacherSectionMemberships)
      .where(
        and(
          inArray(teacherSectionMemberships.sectionId, sectionIds),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      ),
    db
      .select({ count: sql<number>`count(distinct course_id)::int` })
      .from(courseAllocations)
      .where(
        and(
          inArray(courseAllocations.sectionId, sectionIds),
          eq(courseAllocations.status, 'ACTIVE'),
        ),
      ),
  ]);

  return {
    sectionCount: sectionIds.length,
    studentCount: students[0]?.count || 0,
    teacherCount: teachers[0]?.count || 0,
    courseCount: courses[0]?.count || 0,
  };
}

function toClassDto(
  academicClass: typeof classes.$inferSelect,
  organizationName: string,
  stats: Awaited<ReturnType<typeof getClassStats>>,
) {
  return { ...academicClass, publicId: academicClass.id.toUpperCase(), organizationName, ...stats };
}

export async function classRoutes(app: FastifyInstance) {
  // GET /api/classes
  app.get(
    '/api/classes',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const search = query.search?.trim();
      const status = query.status?.trim();
      let organizationId = query.organizationId?.trim();

      if (!isPlatformOwnerRole(request.user!.role)) {
        organizationId = request.user!.organizationId || undefined;
        if (!organizationId) {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(classes.organizationId, organizationId));
      }
      if (status && status !== 'ALL') {
        conditions.push(eq(classes.status, status));
      }
      if (search) {
        conditions.push(ilike(classes.name, `%${search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const classList = await db.query.classes.findMany({
        where: whereClause,
        with: { organization: true },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(classes.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(classes)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      const items = await Promise.all(
        classList.map(async (c) => {
          const secList = await db
            .select({ id: sections.id })
            .from(sections)
            .where(eq(sections.classId, c.id));
          const secIds = secList.map((s) => s.id);

          let studentCount = 0;
          if (secIds.length > 0) {
            const countResult = await db
              .select({ count: sql<number>`count(distinct student_id)::int` })
              .from(studentSectionMemberships)
              .where(
                and(
                  inArray(studentSectionMemberships.sectionId, secIds),
                  eq(studentSectionMemberships.status, 'ACTIVE'),
                ),
              );
            studentCount = countResult[0]?.count || 0;
          }

          const stats = await getClassStats(c.id);
          return toClassDto(c, c.organization?.name || 'Unknown', { ...stats, studentCount });
        }),
      );

      return reply.send({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );

  // GET /api/classes/options
  app.get('/api/classes/options', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    let orgId = request.user!.organizationId;
    if (isPlatformOwnerRole(request.user!.role) && query.organizationId) {
      orgId = query.organizationId;
    }

    if (!orgId) return reply.send([]);

    const options = await db.query.classes.findMany({
      where: and(eq(classes.organizationId, orgId), eq(classes.status, 'ACTIVE')),
      columns: { id: true, name: true, grade: true, organizationId: true },
    });

    return reply.send(options);
  });

  // GET /api/classes/:id
  app.get('/api/classes/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const cls = await db.query.classes.findFirst({
      where: eq(classes.id, id),
      with: { organization: true, sections: true },
    });

    if (!cls) throw Errors.notFound('Class not found');
    if (!checkTenantAccess(request.user!, cls.organizationId)) {
      throw Errors.forbidden('Access denied');
    }

    const stats = await getClassStats(cls.id);
    return reply.send(toClassDto(cls, cls.organization?.name || 'Unknown', stats));
  });

  // POST /api/classes
  app.post(
    '/api/classes',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.name || !body.academicYear) {
        throw Errors.badRequest('Missing required fields: name, academicYear');
      }

      let orgId = body.organizationId;
      if (!isPlatformOwnerRole(request.user!.role)) {
        orgId = request.user!.organizationId;
      }
      if (!orgId) throw Errors.badRequest('Organization ID is required');

      const classId = `cls-${uuidv4().slice(0, 8)}`;
      const newClass = {
        id: classId,
        organizationId: orgId,
        name: body.name.trim(),
        grade:
          typeof body.grade === 'string' && body.grade.trim()
            ? body.grade.trim()
            : body.name.trim(),
        academicYear: body.academicYear.trim(),
        description: body.description || null,
        status: body.status || 'ACTIVE',
      };

      const [created] = await db.insert(classes).values(newClass).returning();
      const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
      return reply
        .status(201)
        .send(toClassDto(created, org?.name || 'Unknown', await getClassStats(classId)));
    },
  );

  // PATCH /api/classes/:id
  app.patch(
    '/api/classes/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const cls = await db.query.classes.findFirst({ where: eq(classes.id, id) });
      if (!cls) throw Errors.notFound('Class not found');
      if (!checkTenantAccess(request.user!, cls.organizationId)) {
        throw Errors.forbidden('Access denied');
      }

      const updateData: any = { updatedAt: new Date() };
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.grade !== undefined) updateData.grade = body.grade.trim();
      if (body.academicYear !== undefined) updateData.academicYear = body.academicYear.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.status !== undefined) updateData.status = body.status;

      await db.update(classes).set(updateData).where(eq(classes.id, id));

      const updated = await db.query.classes.findFirst({ where: eq(classes.id, id) });
      return reply.send(updated);
    },
  );

  // PATCH /api/classes/:id/status
  app.patch(
    '/api/classes/:id/status',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const cls = await db.query.classes.findFirst({ where: eq(classes.id, id) });
      if (!cls) throw Errors.notFound('Class not found');
      if (!checkTenantAccess(request.user!, cls.organizationId)) {
        throw Errors.forbidden('Access denied');
      }

      await db.update(classes).set({ status, updatedAt: new Date() }).where(eq(classes.id, id));
      return reply.send({ success: true, status });
    },
  );
}
