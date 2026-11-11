import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { courses, courseAllocations, studentSectionMemberships } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

async function toCourseDto(course: typeof courses.$inferSelect) {
  const allocationRows = await db.query.courseAllocations.findMany({
    where: eq(courseAllocations.courseId, course.id),
    with: { section: { with: { class: { with: { organization: true } } } } },
  });
  const sectionRows = await db.query.sections.findMany({
    with: { class: { with: { organization: true } } },
  });
  const sectionIds = sectionRows.map((section) => section.id);
  const membershipRows = sectionIds.length
    ? await db
        .select({
          studentId: studentSectionMemberships.studentId,
          sectionId: studentSectionMemberships.sectionId,
        })
        .from(studentSectionMemberships)
        .where(
          and(
            inArray(studentSectionMemberships.sectionId, sectionIds),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        )
    : [];
  const allocations = allocationRows.map((allocation) => {
    const section = sectionRows.find((record) => record.id === allocation.sectionId);
    const classRecord =
      section?.class ?? sectionRows.find((record) => record.classId === allocation.classId)?.class;
    const organization = classRecord?.organization;
    const coveredSectionIds = sectionRows
      .filter((record) =>
        allocation.scope === 'ORGANIZATION'
          ? record.class.organizationId === allocation.organizationId
          : allocation.scope === 'CLASS'
            ? record.classId === allocation.classId
            : record.id === allocation.sectionId,
      )
      .map((record) => record.id);
    const affectedStudentIds = new Set(
      membershipRows
        .filter((membership) => coveredSectionIds.includes(membership.sectionId))
        .map((membership) => membership.studentId),
    );
    const scopedOrganization = allocation.organizationId
      ? sectionRows.find((record) => record.class.organizationId === allocation.organizationId)
          ?.class.organization
      : organization;
    const scopedClass = allocation.classId
      ? sectionRows.find((record) => record.classId === allocation.classId)?.class
      : classRecord;
    return {
      id: allocation.id,
      publicId: allocation.id.toUpperCase(),
      courseId: allocation.courseId,
      organizationId:
        allocation.organizationId || classRecord?.organizationId || course.organizationId || '',
      classId: allocation.classId || section?.classId || null,
      sectionId: allocation.sectionId,
      scope: allocation.scope,
      startDate: allocation.startDate.toISOString(),
      endDate: allocation.endDate?.toISOString() || allocation.startDate.toISOString(),
      accessEnabled: allocation.accessEnabled,
      status: allocation.status,
      revokedAt: allocation.status === 'REVOKED' ? allocation.updatedAt.toISOString() : null,
      createdAt: allocation.createdAt.toISOString(),
      updatedAt: allocation.updatedAt.toISOString(),
      courseTitle: course.title,
      courseLanguage: course.language,
      organizationName: scopedOrganization?.name || 'Unknown organization',
      className: scopedClass?.name || null,
      sectionName: section?.name || null,
      affectedStudentCount: affectedStudentIds.size,
    };
  });

  const status = course.status === 'PUBLISHED' ? 'ACTIVE' : course.status;
  return {
    ...course,
    publicId: course.id.toUpperCase(),
    category: course.category || 'Uncategorized',
    version: Number.parseInt(course.version, 10) || 1,
    status,
    allocationCount: allocations.filter((allocation) => allocation.status === 'ACTIVE').length,
    studentReach: new Set(
      allocations.flatMap((allocation) =>
        membershipRows
          .filter((membership) => {
            const section = sectionRows.find((record) => record.id === membership.sectionId);
            return allocation.scope === 'ORGANIZATION'
              ? section?.class.organizationId === allocation.organizationId
              : allocation.scope === 'CLASS'
                ? section?.classId === allocation.classId
                : section?.id === allocation.sectionId;
          })
          .map((membership) => membership.studentId),
      ),
    ).size,
    allocations,
  };
}

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

    const items = await Promise.all(courseList.map((course) => toCourseDto(course)));

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
    const conditions: any[] = [inArray(courses.status, ['ACTIVE', 'PUBLISHED'])];
    if (request.user!.role !== 'PLATFORM_ADMIN') {
      if (!request.user!.organizationId) return reply.send([]);
      conditions.push(
        or(eq(courses.organizationId, request.user!.organizationId), sql`organization_id IS NULL`),
      );
    }
    const list = await db.query.courses.findMany({
      where: and(...conditions),
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

    return reply.send({
      ...(await toCourseDto(course)),
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
        category: body.category || '',
        description: body.description || null,
        language: body.language || 'PYTHON',
        difficulty: body.difficulty || 'BEGINNER',
        status: body.status || 'PUBLISHED',
        version: String(body.version || '1'),
        createdBy: request.user!.userId,
      };

      const [created] = await db.insert(courses).values(newCourse).returning();
      return reply.status(201).send(await toCourseDto(created));
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
      if (body.category !== undefined) updateData.category = body.category;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.language !== undefined) updateData.language = body.language;
      if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.version !== undefined) updateData.version = body.version;

      await db.update(courses).set(updateData).where(eq(courses.id, id));
      const updated = await db.query.courses.findFirst({ where: eq(courses.id, id) });
      return reply.send(updated ? await toCourseDto(updated) : null);
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
