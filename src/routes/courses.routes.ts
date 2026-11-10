import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { courses, courseAllocations } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

export async function courseRoutes(app: FastifyInstance) {
  // GET /api/courses
  app.get('/api/courses', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const search = query.search?.trim();
    const language = query.language?.trim();
    const status = query.status?.trim();

    const conditions: any[] = [];
    if (request.user!.role !== 'PLATFORM_ADMIN') {
      conditions.push(
        or(eq(courses.organizationId, request.user!.organizationId!), sql`organization_id IS NULL`),
      );
    }
    if (language && language !== 'ALL') conditions.push(eq(courses.language, language));
    if (status && status !== 'ALL') conditions.push(eq(courses.status, status));
    if (search) conditions.push(ilike(courses.title, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const courseList = await db.query.courses.findMany({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(courses.createdAt),
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    const items = await Promise.all(
      courseList.map(async (c) => {
        const allocCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(courseAllocations)
          .where(and(eq(courseAllocations.courseId, c.id), eq(courseAllocations.status, 'ACTIVE')));

        return {
          ...c,
          allocationCount: allocCount[0]?.count || 0,
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
  });

  // GET /api/courses/options
  app.get('/api/courses/options', { preHandler: [authenticate] }, async (request, reply) => {
    const list = await db.query.courses.findMany({
      where: eq(courses.status, 'PUBLISHED'),
      columns: { id: true, title: true, language: true, difficulty: true },
    });
    return reply.send(list);
  });

  // GET /api/courses/:id
  app.get('/api/courses/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: { organization: true },
    });

    if (!course) throw Errors.notFound('Course not found');

    const allocCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseAllocations)
      .where(
        and(eq(courseAllocations.courseId, course.id), eq(courseAllocations.status, 'ACTIVE')),
      );

    return reply.send({
      ...course,
      allocationCount: allocCount[0]?.count || 0,
      organizationName: course.organization?.name || 'Platform-wide',
    });
  });

  // POST /api/courses
  app.post(
    '/api/courses',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.title) throw Errors.badRequest('Course title is required');

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }

      const courseId = `crs-${uuidv4().slice(0, 8)}`;
      const newCourse = {
        id: courseId,
        organizationId: orgId || null,
        title: body.title.trim(),
        description: body.description || null,
        language: body.language || 'PYTHON',
        difficulty: body.difficulty || 'BEGINNER',
        status: body.status || 'PUBLISHED',
        version: body.version || '1.0.0',
        createdBy: request.user!.userId,
      };

      await db.insert(courses).values(newCourse);
      return reply.status(201).send(newCourse);
    },
  );

  // PATCH /api/courses/:id
  app.patch(
    '/api/courses/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const course = await db.query.courses.findFirst({ where: eq(courses.id, id) });
      if (!course) throw Errors.notFound('Course not found');

      const updateData: any = { updatedAt: new Date() };
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.language !== undefined) updateData.language = body.language;
      if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.version !== undefined) updateData.version = body.version;

      await db.update(courses).set(updateData).where(eq(courses.id, id));
      const updated = await db.query.courses.findFirst({ where: eq(courses.id, id) });
      return reply.send(updated);
    },
  );

  // PATCH /api/courses/:id/status
  app.patch(
    '/api/courses/:id/status',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      await db.update(courses).set({ status, updatedAt: new Date() }).where(eq(courses.id, id));
      return reply.send({ success: true, status });
    },
  );
}
