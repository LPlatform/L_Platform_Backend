import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { classes, sections, studentSectionMemberships } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

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

      if (request.user!.role !== 'PLATFORM_ADMIN') {
        organizationId = request.user!.organizationId;
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
                  sql`section_id = ANY(${secIds})`,
                  eq(studentSectionMemberships.status, 'ACTIVE'),
                ),
              );
            studentCount = countResult[0]?.count || 0;
          }

          return {
            ...c,
            organizationName: c.organization?.name || 'Unknown',
            sectionCount: secList.length,
            studentCount,
          };
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
    if (request.user!.role === 'PLATFORM_ADMIN' && query.organizationId) {
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

    return reply.send({
      ...cls,
      organizationName: cls.organization?.name || 'Unknown',
      sectionCount: cls.sections.length,
    });
  });

  // POST /api/classes
  app.post(
    '/api/classes',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.name || !body.grade || !body.academicYear) {
        throw Errors.badRequest('Missing required fields: name, grade, academicYear');
      }

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }
      if (!orgId) throw Errors.badRequest('Organization ID is required');

      const classId = `cls-${uuidv4().slice(0, 8)}`;
      const newClass = {
        id: classId,
        organizationId: orgId,
        name: body.name.trim(),
        grade: body.grade.trim(),
        academicYear: body.academicYear.trim(),
        description: body.description || null,
        status: body.status || 'ACTIVE',
      };

      await db.insert(classes).values(newClass);
      return reply.status(201).send(newClass);
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
