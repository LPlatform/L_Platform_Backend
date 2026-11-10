import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { courseAllocations, courses, sections, users } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

export async function allocationRoutes(app: FastifyInstance) {
  // GET /api/allocations
  app.get(
    '/api/allocations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const courseId = query.courseId?.trim();
      const sectionId = query.sectionId?.trim();
      const status = query.status?.trim();

      const conditions: any[] = [];
      if (courseId) conditions.push(eq(courseAllocations.courseId, courseId));
      if (sectionId) conditions.push(eq(courseAllocations.sectionId, sectionId));
      if (status && status !== 'ALL') conditions.push(eq(courseAllocations.status, status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const allocList = await db.query.courseAllocations.findMany({
        where: whereClause,
        with: {
          section: { with: { class: true } },
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(courseAllocations.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courseAllocations)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      const items = await Promise.all(
        allocList.map(async (a) => {
          const course = await db.query.courses.findFirst({
            where: eq(courses.id, a.courseId),
          });
          const teacher = a.teacherId
            ? await db.query.users.findFirst({ where: eq(users.id, a.teacherId) })
            : null;

          const sec = a.section as any;

          return {
            id: a.id,
            courseId: a.courseId,
            courseTitle: course?.title || 'Unknown Course',
            sectionId: a.sectionId,
            sectionName: sec?.name || 'Unknown Section',
            className: sec?.class?.name || 'Unknown Class',
            teacherId: a.teacherId,
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned',
            status: a.status,
            startDate: a.startDate,
            endDate: a.endDate,
            createdAt: a.createdAt,
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

  // GET /api/allocations/:id
  app.get('/api/allocations/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const a = await db.query.courseAllocations.findFirst({
      where: eq(courseAllocations.id, id),
      with: {
        section: { with: { class: true } },
      },
    });

    if (!a) throw Errors.notFound('Allocation not found');

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, a.courseId),
    });
    const teacher = a.teacherId
      ? await db.query.users.findFirst({ where: eq(users.id, a.teacherId) })
      : null;

    const sec = a.section as any;

    return reply.send({
      id: a.id,
      courseId: a.courseId,
      courseTitle: course?.title || 'Unknown Course',
      sectionId: a.sectionId,
      sectionName: sec?.name || 'Unknown Section',
      className: sec?.class?.name || 'Unknown Class',
      teacherId: a.teacherId,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned',
      status: a.status,
      startDate: a.startDate,
      endDate: a.endDate,
      createdAt: a.createdAt,
    });
  });

  // POST /api/allocations
  app.post(
    '/api/allocations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.courseId || !body.sectionId) {
        throw Errors.badRequest('courseId and sectionId are required');
      }

      const id = `alloc-${uuidv4().slice(0, 8)}`;
      const newAlloc = {
        id,
        courseId: body.courseId,
        sectionId: body.sectionId,
        teacherId: body.teacherId || null,
        status: body.status || 'ACTIVE',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
      };

      await db.insert(courseAllocations).values(newAlloc);

      const course = await db.query.courses.findFirst({ where: eq(courses.id, body.courseId) });
      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, body.sectionId),
        with: { class: true },
      });

      return reply.status(201).send({
        ...newAlloc,
        courseTitle: course?.title || '',
        sectionName: sec?.name || '',
        className: sec?.class?.name || '',
      });
    },
  );

  // PATCH /api/allocations/:id
  app.patch(
    '/api/allocations/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const updateData: any = { updatedAt: new Date() };
      if (body.teacherId !== undefined) updateData.teacherId = body.teacherId;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
      if (body.endDate !== undefined)
        updateData.endDate = body.endDate ? new Date(body.endDate) : null;

      await db.update(courseAllocations).set(updateData).where(eq(courseAllocations.id, id));
      return reply.send({ success: true });
    },
  );

  // PATCH /api/allocations/:id/revoke
  app.patch(
    '/api/allocations/:id/revoke',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await db
        .update(courseAllocations)
        .set({ status: 'REVOKED', updatedAt: new Date() })
        .where(eq(courseAllocations.id, id));

      return reply.send({ success: true, status: 'REVOKED' });
    },
  );
}
