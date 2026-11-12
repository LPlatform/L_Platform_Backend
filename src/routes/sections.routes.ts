import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  sections,
  classes,
  users,
  studentSectionMemberships,
  teacherSectionMemberships,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  isPlatformOwnerRole,
  requireRole,
  checkTenantAccess,
} from '../middleware/auth.js';

export async function sectionRoutes(app: FastifyInstance) {
  // GET /api/sections
  app.get(
    '/api/sections',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const classId = query.classId?.trim();
      const status = query.status?.trim();
      const search = query.search?.trim();

      const conditions: any[] = [];
      if (classId) conditions.push(eq(sections.classId, classId));
      if (status && status !== 'ALL') conditions.push(eq(sections.status, status));
      if (search) conditions.push(ilike(sections.name, `%${search}%`));

      if (request.user!.role === 'TEACHER') {
        const memberships = await db.query.teacherSectionMemberships.findMany({
          where: and(
            eq(teacherSectionMemberships.teacherId, request.user!.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
          columns: { sectionId: true },
        });
        const assignedIds = memberships.map((membership) => membership.sectionId);
        if (assignedIds.length === 0) {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
        conditions.push(inArray(sections.id, assignedIds));
      } else if (request.user!.role === 'ORGANIZATION_ADMIN') {
        if (!request.user!.organizationId) {
          throw Errors.forbidden('Organization admin is not assigned to an organization');
        }
        const organizationClasses = await db.query.classes.findMany({
          where: eq(classes.organizationId, request.user!.organizationId),
          columns: { id: true },
        });
        const classIds = organizationClasses.map((academicClass) => academicClass.id);
        if (classIds.length === 0) {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
        conditions.push(inArray(sections.classId, classIds));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const sectionList = await db.query.sections.findMany({
        where: whereClause,
        with: {
          class: {
            with: { organization: true },
          },
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(sections.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(sections)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      const items = await Promise.all(
        sectionList.map(async (sec) => {
          const studentCountRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(studentSectionMemberships)
            .where(
              and(
                eq(studentSectionMemberships.sectionId, sec.id),
                eq(studentSectionMemberships.status, 'ACTIVE'),
              ),
            );
          const teacherCountRes = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(teacherSectionMemberships)
            .where(
              and(
                eq(teacherSectionMemberships.sectionId, sec.id),
                eq(teacherSectionMemberships.status, 'ACTIVE'),
              ),
            );

          return {
            ...sec,
            publicId: sec.id.toUpperCase(),
            joinCode: sec.id.toUpperCase(),
            className: sec.class?.name || 'Unknown',
            classGrade: sec.class?.grade || '',
            academicYear: sec.class?.academicYear || '',
            organizationId: sec.class?.organizationId,
            organizationName: sec.class?.organization?.name || 'Unknown',
            studentCount: studentCountRes[0]?.count || 0,
            teacherCount: teacherCountRes[0]?.count || 0,
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

  // GET /api/sections/:id
  app.get('/api/sections/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const sec = await db.query.sections.findFirst({
      where: eq(sections.id, id),
      with: {
        class: { with: { organization: true } },
      },
    });

    if (!sec) throw Errors.notFound('Section not found');
    await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

    const studentCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(studentSectionMemberships)
      .where(
        and(
          eq(studentSectionMemberships.sectionId, sec.id),
          eq(studentSectionMemberships.status, 'ACTIVE'),
        ),
      );
    const teacherCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teacherSectionMemberships)
      .where(
        and(
          eq(teacherSectionMemberships.sectionId, sec.id),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      );

    return reply.send({
      ...sec,
      publicId: sec.id.toUpperCase(),
      joinCode: sec.id.toUpperCase(),
      className: sec.class?.name || 'Unknown',
      classGrade: sec.class?.grade || '',
      academicYear: sec.class?.academicYear || '',
      organizationId: sec.class?.organizationId,
      organizationName: sec.class?.organization?.name || 'Unknown',
      studentCount: studentCountRes[0]?.count || 0,
      teacherCount: teacherCountRes[0]?.count || 0,
    });
  });

  // GET /api/sections/:id/roster
  app.get('/api/sections/:id/roster', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // Rosters list classmates' personal data; only staff may read them.
    if (request.user!.role === 'STUDENT') {
      throw Errors.forbidden('Students cannot view section rosters');
    }
    const section = await db.query.sections.findFirst({
      where: eq(sections.id, id),
      with: { class: true },
    });
    if (!section) throw Errors.notFound('Section not found');
    await assertSectionAccess(request.user!, section.id, section.class.organizationId);

    const studentMemberships = await db
      .select({
        membershipId: studentSectionMemberships.id,
        joinedAt: studentSectionMemberships.joinedAt,
        student: users,
      })
      .from(studentSectionMemberships)
      .innerJoin(users, eq(studentSectionMemberships.studentId, users.id))
      .where(
        and(
          eq(studentSectionMemberships.sectionId, id),
          eq(studentSectionMemberships.status, 'ACTIVE'),
        ),
      );

    const teacherMemberships = await db
      .select({
        membershipId: teacherSectionMemberships.id,
        assignedAt: teacherSectionMemberships.assignedAt,
        teacher: users,
      })
      .from(teacherSectionMemberships)
      .innerJoin(users, eq(teacherSectionMemberships.teacherId, users.id))
      .where(
        and(
          eq(teacherSectionMemberships.sectionId, id),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      )
      .orderBy(asc(teacherSectionMemberships.assignedAt), asc(teacherSectionMemberships.id));

    return reply.send({
      students: studentMemberships.map((m) => ({
        ...m.student,
        name: `${m.student.firstName} ${m.student.lastName}`,
        joinedAt: m.joinedAt,
      })),
      teachers: teacherMemberships.map((m, index) => ({
        ...m.teacher,
        name: `${m.teacher.firstName} ${m.teacher.lastName}`,
        assignedAt: m.assignedAt,
        teacherRole: index === 0 ? ('PRIMARY' as const) : ('CO_TEACHER' as const),
      })),
    });
  });

  // POST /api/sections
  app.post(
    '/api/sections',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.classId || !body.name) {
        throw Errors.badRequest('Missing required fields: classId, name');
      }

      const cls = await db.query.classes.findFirst({ where: eq(classes.id, body.classId) });
      if (!cls) throw Errors.notFound('Class not found');
      if (!checkTenantAccess(request.user!, cls.organizationId)) {
        throw Errors.forbidden('Access denied to this class');
      }

      const secId = `sec-${uuidv4().slice(0, 8)}`;
      const newSec = {
        id: secId,
        classId: body.classId,
        name: body.name.trim(),
        maxStudents: body.maxStudents || 40,
        status: body.status || 'ACTIVE',
      };

      await db.insert(sections).values(newSec);
      return reply.status(201).send(newSec);
    },
  );

  // PATCH /api/sections/:id
  app.patch(
    '/api/sections/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      const updateData: any = { updatedAt: new Date() };
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.maxStudents !== undefined) updateData.maxStudents = body.maxStudents;
      if (body.status !== undefined) updateData.status = body.status;

      await db.update(sections).set(updateData).where(eq(sections.id, id));
      const updated = await db.query.sections.findFirst({ where: eq(sections.id, id) });
      return reply.send(updated);
    },
  );

  // PATCH /api/sections/:id/status
  app.patch(
    '/api/sections/:id/status',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      await db.update(sections).set({ status, updatedAt: new Date() }).where(eq(sections.id, id));
      return reply.send({ success: true, status });
    },
  );

  // POST /api/sections/:id/students - assign students
  app.post(
    '/api/sections/:id/students',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { studentIds } = request.body as { studentIds: string[] };

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        throw Errors.badRequest('studentIds must be a non-empty array');
      }

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      const targetStudents = await db.query.users.findMany({
        where: inArray(users.id, studentIds),
      });
      if (targetStudents.length !== new Set(studentIds).size) {
        throw Errors.badRequest('One or more students do not exist');
      }
      if (
        targetStudents.some(
          (student) =>
            student.role !== 'STUDENT' || student.organizationId !== sec.class.organizationId,
        )
      ) {
        throw Errors.forbidden(
          'Only active students belonging to this school organization can be enrolled',
        );
      }

      let assigned = 0;
      let skipped = 0;

      for (const studentId of studentIds) {
        const existing = await db.query.studentSectionMemberships.findFirst({
          where: and(
            eq(studentSectionMemberships.sectionId, id),
            eq(studentSectionMemberships.studentId, studentId),
          ),
        });

        if (existing) {
          if (existing.status !== 'ACTIVE') {
            await db
              .update(studentSectionMemberships)
              .set({ status: 'ACTIVE', joinedAt: new Date(), leftAt: null })
              .where(eq(studentSectionMemberships.id, existing.id));
            assigned++;
          } else {
            skipped++;
          }
        } else {
          await db.insert(studentSectionMemberships).values({
            id: `ssm-${uuidv4().slice(0, 8)}`,
            sectionId: id,
            studentId,
            status: 'ACTIVE',
          });
          assigned++;
        }
      }

      return reply.send({ assigned, skipped });
    },
  );

  // POST /api/sections/:id/students/bulk - CSV bulk assign existing org students by email
  app.post(
    '/api/sections/:id/students/bulk',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { csvText?: string; emails?: string[] };

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      let parsedEmails: string[] = [];
      if (Array.isArray(body.emails)) {
        parsedEmails = body.emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
      } else if (typeof body.csvText === 'string' && body.csvText.trim()) {
        const lines = body.csvText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
        const startIdx = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
        for (let i = startIdx; i < lines.length; i++) {
          const email = lines[i].split(',')[0]?.trim().toLowerCase();
          if (email && email.includes('@')) parsedEmails.push(email);
        }
      }

      const uniqueEmails = Array.from(new Set(parsedEmails));
      if (uniqueEmails.length === 0) {
        throw Errors.badRequest('Provide valid student email addresses via csvText or emails');
      }

      const matchingUsers = await db.query.users.findMany({
        where: and(
          inArray(users.email, uniqueEmails),
          eq(users.role, 'STUDENT'),
          eq(users.organizationId, sec.class.organizationId),
        ),
      });
      const userByEmail = new Map(matchingUsers.map((u) => [u.email.toLowerCase(), u]));

      let assigned = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const email of uniqueEmails) {
        const student = userByEmail.get(email);
        if (!student) {
          skipped++;
          errors.push(`Student '${email}' not found in this organization`);
          continue;
        }
        const existing = await db.query.studentSectionMemberships.findFirst({
          where: and(
            eq(studentSectionMemberships.sectionId, id),
            eq(studentSectionMemberships.studentId, student.id),
          ),
        });
        if (existing?.status === 'ACTIVE') {
          skipped++;
          continue;
        }
        if (existing) {
          await db
            .update(studentSectionMemberships)
            .set({ status: 'ACTIVE', joinedAt: new Date(), leftAt: null })
            .where(eq(studentSectionMemberships.id, existing.id));
        } else {
          await db.insert(studentSectionMemberships).values({
            id: `ssm-${uuidv4().slice(0, 8)}`,
            sectionId: id,
            studentId: student.id,
            status: 'ACTIVE',
          });
        }
        assigned++;
      }

      return reply.send({ assigned, skipped, total: uniqueEmails.length, errors });
    },
  );

  // DELETE /api/sections/:id/students/:studentId
  app.delete(
    '/api/sections/:id/students/:studentId',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id, studentId } = request.params as { id: string; studentId: string };

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      await db
        .update(studentSectionMemberships)
        .set({ status: 'INACTIVE', leftAt: new Date() })
        .where(
          and(
            eq(studentSectionMemberships.sectionId, id),
            eq(studentSectionMemberships.studentId, studentId),
          ),
        );

      return reply.send({ success: true });
    },
  );

  // POST /api/sections/:id/teachers
  app.post(
    '/api/sections/:id/teachers',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { teacherIds } = request.body as { teacherIds: string[] };

      if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        throw Errors.badRequest('teacherIds must be a non-empty array');
      }

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      const targetTeachers = await db.query.users.findMany({
        where: inArray(users.id, teacherIds),
      });
      if (targetTeachers.length !== new Set(teacherIds).size) {
        throw Errors.badRequest('One or more teachers do not exist');
      }
      if (
        targetTeachers.some(
          (teacher) =>
            teacher.role !== 'TEACHER' || teacher.organizationId !== sec.class.organizationId,
        )
      ) {
        throw Errors.forbidden(
          'Only active teachers belonging to this school organization can be assigned',
        );
      }

      let assigned = 0;
      let skipped = 0;

      for (const teacherId of teacherIds) {
        const existing = await db.query.teacherSectionMemberships.findFirst({
          where: and(
            eq(teacherSectionMemberships.sectionId, id),
            eq(teacherSectionMemberships.teacherId, teacherId),
          ),
        });

        if (existing) {
          if (existing.status !== 'ACTIVE') {
            await db
              .update(teacherSectionMemberships)
              .set({ status: 'ACTIVE', assignedAt: new Date(), removedAt: null })
              .where(eq(teacherSectionMemberships.id, existing.id));
            assigned++;
          } else {
            skipped++;
          }
        } else {
          await db.insert(teacherSectionMemberships).values({
            id: `tsm-${uuidv4().slice(0, 8)}`,
            sectionId: id,
            teacherId,
            status: 'ACTIVE',
          });
          assigned++;
        }
      }

      return reply.send({ assigned, skipped });
    },
  );

  // DELETE /api/sections/:id/teachers/:teacherId
  app.delete(
    '/api/sections/:id/teachers/:teacherId',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id, teacherId } = request.params as { id: string; teacherId: string };

      const sec = await db.query.sections.findFirst({
        where: eq(sections.id, id),
        with: { class: true },
      });
      if (!sec) throw Errors.notFound('Section not found');
      await assertSectionAccess(request.user!, sec.id, sec.class.organizationId);

      await db
        .update(teacherSectionMemberships)
        .set({ status: 'INACTIVE', removedAt: new Date() })
        .where(
          and(
            eq(teacherSectionMemberships.sectionId, id),
            eq(teacherSectionMemberships.teacherId, teacherId),
          ),
        );

      return reply.send({ success: true });
    },
  );
}

async function assertSectionAccess(
  user: { userId: string; role: any; organizationId: string | null },
  sectionId: string,
  organizationId: string,
) {
  if (isPlatformOwnerRole(user.role)) return;
  if (user.role === 'ORGANIZATION_ADMIN' && user.organizationId === organizationId) return;
  if (user.role === 'TEACHER') {
    const membership = await db.query.teacherSectionMemberships.findFirst({
      where: and(
        eq(teacherSectionMemberships.sectionId, sectionId),
        eq(teacherSectionMemberships.teacherId, user.userId),
        eq(teacherSectionMemberships.status, 'ACTIVE'),
      ),
    });
    if (membership) return;
  } else if (user.role === 'STUDENT') {
    const membership = await db.query.studentSectionMemberships.findFirst({
      where: and(
        eq(studentSectionMemberships.sectionId, sectionId),
        eq(studentSectionMemberships.studentId, user.userId),
        eq(studentSectionMemberships.status, 'ACTIVE'),
      ),
    });
    if (membership) return;
  }
  throw Errors.forbidden('Access denied to this section');
}
