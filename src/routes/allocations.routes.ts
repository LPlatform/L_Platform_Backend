import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
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
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  checkTenantAccess,
  isPlatformOwnerRole,
  requireRole,
} from '../middleware/auth.js';

type AllocationRow = typeof courseAllocations.$inferSelect;

async function toAllocationDto(allocation: AllocationRow) {
  const [course, organization, classRecord, section, teacher] = await Promise.all([
    db.query.courses.findFirst({ where: eq(courses.id, allocation.courseId) }),
    allocation.organizationId
      ? db.query.organizations.findFirst({ where: eq(organizations.id, allocation.organizationId) })
      : undefined,
    allocation.classId
      ? db.query.classes.findFirst({ where: eq(classes.id, allocation.classId) })
      : undefined,
    allocation.sectionId
      ? db.query.sections.findFirst({ where: eq(sections.id, allocation.sectionId) })
      : undefined,
    allocation.teacherId
      ? db.query.users.findFirst({ where: eq(users.id, allocation.teacherId) })
      : undefined,
  ]);

  let sectionIds: string[] = [];
  if (allocation.scope === 'SECTION' && allocation.sectionId) {
    sectionIds = [allocation.sectionId];
  } else if (allocation.scope === 'CLASS' && allocation.classId) {
    const classSections = await db
      .select({ id: sections.id })
      .from(sections)
      .where(eq(sections.classId, allocation.classId));
    sectionIds = classSections.map((row) => row.id);
  } else if (allocation.organizationId) {
    const organizationSections = await db
      .select({ id: sections.id })
      .from(sections)
      .innerJoin(classes, eq(sections.classId, classes.id))
      .where(eq(classes.organizationId, allocation.organizationId));
    sectionIds = organizationSections.map((row) => row.id);
  }

  const students = sectionIds.length
    ? await db
        .select({ count: sql<number>`count(distinct student_id)::int` })
        .from(studentSectionMemberships)
        .where(
          and(
            inArray(studentSectionMemberships.sectionId, sectionIds),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        )
    : [];

  const now = new Date();
  const status =
    allocation.status === 'REVOKED'
      ? 'REVOKED'
      : allocation.startDate > now
        ? 'SCHEDULED'
        : allocation.endDate && allocation.endDate < now
          ? 'EXPIRED'
          : 'ACTIVE';

  return {
    id: allocation.id,
    publicId: allocation.id.toUpperCase(),
    courseId: allocation.courseId,
    courseTitle: course?.title || 'Unknown Course',
    courseLanguage: course?.language || 'PYTHON',
    organizationId: allocation.organizationId || '',
    organizationName: organization?.name || 'Unknown organization',
    classId: allocation.classId,
    className: classRecord?.name || null,
    sectionId: allocation.sectionId,
    sectionName: section?.name || null,
    scope: allocation.scope,
    teacherId: allocation.teacherId,
    teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned',
    startDate: allocation.startDate.toISOString(),
    endDate: allocation.endDate?.toISOString() || allocation.startDate.toISOString(),
    accessEnabled: allocation.accessEnabled,
    status,
    revokedAt: allocation.revokedAt?.toISOString() || null,
    affectedStudentCount: students[0]?.count || 0,
    createdAt: allocation.createdAt.toISOString(),
    updatedAt: allocation.updatedAt.toISOString(),
  };
}

export async function allocationRoutes(app: FastifyInstance) {
  app.get(
    '/api/allocations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const conditions: any[] = [];

      if (!isPlatformOwnerRole(request.user!.role)) {
        if (request.user!.organizationId) {
          conditions.push(eq(courseAllocations.organizationId, request.user!.organizationId));
        } else {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
      } else if (query.organizationId && query.organizationId !== 'ALL') {
        conditions.push(eq(courseAllocations.organizationId, query.organizationId));
      }
      if (query.courseId) conditions.push(eq(courseAllocations.courseId, query.courseId));
      if (query.classId) conditions.push(eq(courseAllocations.classId, query.classId));
      if (query.sectionId) conditions.push(eq(courseAllocations.sectionId, query.sectionId));
      if (query.scope && query.scope !== 'ALL')
        conditions.push(eq(courseAllocations.scope, query.scope));
      if (
        query.status &&
        query.status !== 'ALL' &&
        query.status !== 'SCHEDULED' &&
        query.status !== 'EXPIRED'
      ) {
        conditions.push(eq(courseAllocations.status, query.status));
      }
      if (query.search) {
        const matchingCourses = await db
          .select({ id: courses.id })
          .from(courses)
          .where(ilike(courses.title, `%${String(query.search).trim()}%`));
        if (matchingCourses.length) {
          conditions.push(
            inArray(
              courseAllocations.courseId,
              matchingCourses.map((course) => course.id),
            ),
          );
        } else {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
      }

      const whereClause = conditions.length ? and(...conditions) : undefined;
      const rows = await db.query.courseAllocations.findMany({
        where: whereClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(courseAllocations.createdAt),
      });
      const count = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(courseAllocations)
        .where(whereClause);
      const total = count[0]?.count || 0;
      const allItems = await Promise.all(rows.map((row) => toAllocationDto(row)));
      const items =
        query.status === 'SCHEDULED' || query.status === 'EXPIRED'
          ? allItems.filter((item) => item.status === query.status)
          : allItems;

      return reply.send({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    },
  );

  app.get('/api/allocations/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const allocation = await db.query.courseAllocations.findFirst({
      where: eq(courseAllocations.id, id),
    });
    if (!allocation) throw Errors.notFound('Allocation not found');
    if (!checkTenantAccess(request.user!, allocation.organizationId || '')) {
      throw Errors.forbidden('You do not have access to this allocation');
    }
    return reply.send(await toAllocationDto(allocation));
  });

  app.post(
    '/api/allocations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      const scope = body.sectionId ? 'SECTION' : body.classId ? 'CLASS' : 'ORGANIZATION';
      if (!body.courseId || !body.organizationId) {
        throw Errors.badRequest('courseId and organizationId are required');
      }
      if (!['ORGANIZATION', 'CLASS', 'SECTION'].includes(scope)) {
        throw Errors.badRequest('Invalid allocation scope');
      }
      if (
        !isPlatformOwnerRole(request.user!.role) &&
        !checkTenantAccess(request.user!, body.organizationId)
      ) {
        throw Errors.forbidden('You do not have access to this organization');
      }
      const course = await db.query.courses.findFirst({ where: eq(courses.id, body.courseId) });
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, body.organizationId),
      });
      if (!course || !organization) throw Errors.notFound('Course or organization not found');
      if (course.status !== 'ACTIVE' && course.status !== 'PUBLISHED') {
        throw Errors.badRequest('Only active courses can be allocated');
      }

      let classId: string | null = null;
      let sectionId: string | null = null;
      if (scope === 'CLASS') {
        if (!body.classId) throw Errors.badRequest('classId is required for class scope');
        const classRecord = await db.query.classes.findFirst({
          where: eq(classes.id, body.classId),
        });
        if (!classRecord || classRecord.organizationId !== body.organizationId) {
          throw Errors.badRequest('The selected class does not belong to the organization');
        }
        classId = classRecord.id;
      } else if (scope === 'SECTION') {
        if (!body.sectionId) throw Errors.badRequest('sectionId is required for section scope');
        const sectionRecord = await db.query.sections.findFirst({
          where: eq(sections.id, body.sectionId),
          with: { class: true },
        });
        if (!sectionRecord || sectionRecord.class.organizationId !== body.organizationId) {
          throw Errors.badRequest('The selected section does not belong to the organization');
        }
        classId = sectionRecord.classId;
        sectionId = sectionRecord.id;
      }

      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
      ) {
        throw Errors.badRequest('A valid allocation date range is required');
      }
      const [created] = await db
        .insert(courseAllocations)
        .values({
          id: `alloc-${uuidv4().slice(0, 8)}`,
          courseId: body.courseId,
          organizationId: body.organizationId,
          classId,
          sectionId,
          scope,
          status: 'ACTIVE',
          accessEnabled: body.accessEnabled !== false,
          startDate,
          endDate,
        })
        .returning();

      return reply.status(201).send(await toAllocationDto(created));
    },
  );

  app.patch(
    '/api/allocations/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const current = await db.query.courseAllocations.findFirst({
        where: eq(courseAllocations.id, id),
      });
      if (!current) throw Errors.notFound('Allocation not found');
      if (!checkTenantAccess(request.user!, current.organizationId || '')) {
        throw Errors.forbidden('You do not have access to this allocation');
      }

      const updateData: Partial<AllocationRow> = { updatedAt: new Date() };
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
      if (body.endDate !== undefined)
        updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      if (body.accessEnabled !== undefined) updateData.accessEnabled = Boolean(body.accessEnabled);
      if (
        updateData.startDate &&
        updateData.endDate &&
        (Number.isNaN(updateData.startDate.getTime()) ||
          Number.isNaN(updateData.endDate.getTime()) ||
          updateData.endDate <= updateData.startDate)
      ) {
        throw Errors.badRequest('A valid allocation date range is required');
      }
      const [updated] = await db
        .update(courseAllocations)
        .set(updateData)
        .where(eq(courseAllocations.id, id))
        .returning();
      return reply.send(await toAllocationDto(updated));
    },
  );

  app.patch(
    '/api/allocations/:id/revoke',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const current = await db.query.courseAllocations.findFirst({
        where: eq(courseAllocations.id, id),
      });
      if (!current) throw Errors.notFound('Allocation not found');
      if (!checkTenantAccess(request.user!, current.organizationId || '')) {
        throw Errors.forbidden('You do not have access to this allocation');
      }
      const [updated] = await db
        .update(courseAllocations)
        .set({ status: 'REVOKED', revokedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseAllocations.id, id))
        .returning();
      return reply.send(await toAllocationDto(updated));
    },
  );
}
