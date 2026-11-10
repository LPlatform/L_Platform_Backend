import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or, notInArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  users,
  credentials,
  organizations,
  studentSectionMemberships,
  teacherSectionMemberships,
} from '../db/schema/index.js';
import { hashPassword } from '../lib/auth.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/users
  app.get(
    '/api/users',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const search = query.search?.trim();
      const role = query.role?.trim();
      const status = query.status?.trim();
      let organizationId = query.organizationId?.trim();

      // Multi-tenant check
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        organizationId = request.user!.organizationId;
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(users.organizationId, organizationId));
      }
      if (role && role !== 'ALL') {
        conditions.push(eq(users.role, role));
      }
      if (status && status !== 'ALL') {
        conditions.push(eq(users.status, status));
      }
      if (search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
          ),
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const userList = await db.query.users.findMany({
        where: whereClause,
        with: { organization: true },
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(users.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      return reply.send({
        items: userList.map((u) => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
          organizationName: u.organization?.name || 'Platform-wide',
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );

  // GET /api/users/eligible/students
  app.get(
    '/api/users/eligible/students',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const query = request.query as any;
      const sectionId = query.sectionId as string;
      const search = query.search?.trim();
      let orgId = request.user!.organizationId;
      if (request.user!.role === 'PLATFORM_ADMIN' && query.organizationId) {
        orgId = query.organizationId;
      }

      const conditions: any[] = [eq(users.role, 'STUDENT'), eq(users.status, 'ACTIVE')];
      if (orgId) {
        conditions.push(eq(users.organizationId, orgId));
      }
      if (search) {
        conditions.push(
          or(
            ilike(users.firstName, `%${search}%`),
            ilike(users.lastName, `%${search}%`),
            ilike(users.email, `%${search}%`),
          ),
        );
      }

      // Exclude already enrolled in this section
      if (sectionId) {
        const enrolled = await db
          .select({ studentId: studentSectionMemberships.studentId })
          .from(studentSectionMemberships)
          .where(
            and(
              eq(studentSectionMemberships.sectionId, sectionId),
              eq(studentSectionMemberships.status, 'ACTIVE'),
            ),
          );
        const enrolledIds = enrolled.map((e) => e.studentId);
        if (enrolledIds.length > 0) {
          conditions.push(notInArray(users.id, enrolledIds));
        }
      }

      const eligible = await db.query.users.findMany({
        where: and(...conditions),
        limit: 50,
      });

      return reply.send({
        items: eligible.map((u) => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
        })),
      });
    },
  );

  // GET /api/users/eligible/teachers
  app.get(
    '/api/users/eligible/teachers',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      let orgId = request.user!.organizationId;
      if (request.user!.role === 'PLATFORM_ADMIN' && query.organizationId) {
        orgId = query.organizationId;
      }

      const conditions: any[] = [eq(users.role, 'TEACHER'), eq(users.status, 'ACTIVE')];
      if (orgId) {
        conditions.push(eq(users.organizationId, orgId));
      }

      const eligible = await db.query.users.findMany({
        where: and(...conditions),
        limit: 100,
      });

      return reply.send({
        items: eligible.map((u) => ({
          ...u,
          name: `${u.firstName} ${u.lastName}`,
        })),
      });
    },
  );

  // GET /api/users/:id
  app.get('/api/users/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { organization: true },
    });

    if (!user) {
      throw Errors.notFound('User not found');
    }

    if (
      request.user!.role !== 'PLATFORM_ADMIN' &&
      request.user!.userId !== user.id &&
      user.organizationId !== request.user!.organizationId
    ) {
      throw Errors.forbidden('Access denied');
    }

    return reply.send({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      organizationName: user.organization?.name || 'Platform-wide',
    });
  });

  // POST /api/users
  app.post(
    '/api/users',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;

      if (!body.email || !body.firstName || !body.lastName || !body.role) {
        throw Errors.badRequest('Missing required fields: email, firstName, lastName, role');
      }

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }

      // Check email uniqueness
      const existing = await db.query.users.findFirst({
        where: eq(users.email, body.email.toLowerCase().trim()),
      });
      if (existing) {
        throw Errors.conflict('User with this email already exists');
      }

      const userId = `usr-${uuidv4().slice(0, 8)}`;
      const newUser = {
        id: userId,
        organizationId: orgId || null,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.toLowerCase().trim(),
        role: body.role,
        status: body.status || 'ACTIVE',
      };

      await db.insert(users).values(newUser);

      // Create credentials
      const tempPassword = body.password || 'Welcome@123';
      const passwordHash = await hashPassword(tempPassword);
      await db.insert(credentials).values({
        userId,
        passwordHash,
      });

      return reply.status(201).send({
        ...newUser,
        name: `${newUser.firstName} ${newUser.lastName}`,
      });
    },
  );

  // PATCH /api/users/:id
  app.patch(
    '/api/users/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!user) throw Errors.notFound('User not found');

      if (
        request.user!.role !== 'PLATFORM_ADMIN' &&
        user.organizationId !== request.user!.organizationId
      ) {
        throw Errors.forbidden('Access denied');
      }

      const updateData: any = { updatedAt: new Date() };
      if (body.firstName !== undefined) updateData.firstName = body.firstName.trim();
      if (body.lastName !== undefined) updateData.lastName = body.lastName.trim();
      if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
      if (body.status !== undefined) updateData.status = body.status;

      await db.update(users).set(updateData).where(eq(users.id, id));

      const updated = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: { organization: true },
      });

      return reply.send({
        ...updated,
        name: `${updated?.firstName} ${updated?.lastName}`,
      });
    },
  );

  // PATCH /api/users/:id/status
  app.patch(
    '/api/users/:id/status',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        throw Errors.badRequest('Invalid status');
      }

      const user = await db.query.users.findFirst({ where: eq(users.id, id) });
      if (!user) throw Errors.notFound('User not found');

      if (
        request.user!.role !== 'PLATFORM_ADMIN' &&
        user.organizationId !== request.user!.organizationId
      ) {
        throw Errors.forbidden('Access denied');
      }

      await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id));

      return reply.send({ success: true, status });
    },
  );

  // POST /api/users/import/preview
  app.post(
    '/api/users/import/preview',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { csvText, fileName } = request.body as any;
      if (!csvText) throw Errors.badRequest('CSV text is required');

      const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (lines.length < 2) {
        return reply.send({
          fileName,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          rows: [],
        });
      }

      const header = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      const emailIdx = header.indexOf('email');
      const firstIdx =
        header.indexOf('firstname') !== -1
          ? header.indexOf('firstname')
          : header.indexOf('first_name');
      const lastIdx =
        header.indexOf('lastname') !== -1
          ? header.indexOf('lastname')
          : header.indexOf('last_name');
      const roleIdx = header.indexOf('role');

      const rows: any[] = [];
      let valid = 0;
      let invalid = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p: string) => p.trim());
        const email = parts[emailIdx] || '';
        const firstName = parts[firstIdx] || '';
        const lastName = parts[lastIdx] || '';
        const role = parts[roleIdx] || 'STUDENT';

        const isValid = email.includes('@') && firstName.length > 0 && lastName.length > 0;
        if (isValid) valid++;
        else invalid++;

        rows.push({
          rowNumber: i,
          email,
          firstName,
          lastName,
          role,
          isValid,
          errors: isValid ? [] : ['Missing or invalid required fields'],
        });
      }

      return reply.send({
        fileName,
        totalRows: lines.length - 1,
        validRows: valid,
        invalidRows: invalid,
        rows,
      });
    },
  );

  // POST /api/users/import/confirm
  app.post(
    '/api/users/import/confirm',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { rows } = request.body as any;
      if (!Array.isArray(rows)) throw Errors.badRequest('Rows array is required');

      const orgId = request.user!.organizationId;
      let imported = 0;
      let skipped = 0;

      const defaultPassHash = await hashPassword('Welcome@123');

      for (const row of rows) {
        if (!row.isValid) {
          skipped++;
          continue;
        }

        const existing = await db.query.users.findFirst({
          where: eq(users.email, row.email.toLowerCase().trim()),
        });

        if (existing) {
          skipped++;
          continue;
        }

        const userId = `usr-${uuidv4().slice(0, 8)}`;
        await db.insert(users).values({
          id: userId,
          organizationId: orgId,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.toLowerCase().trim(),
          role: row.role || 'STUDENT',
          status: 'ACTIVE',
        });

        await db.insert(credentials).values({
          userId,
          passwordHash: defaultPassHash,
        });

        imported++;
      }

      return reply.send({
        imported,
        skipped,
        total: rows.length,
      });
    },
  );
}
