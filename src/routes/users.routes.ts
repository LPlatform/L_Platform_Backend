import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or, notInArray, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { runWithRlsContext } from '../db/rls-context.js';
import {
  users,
  credentials,
  organizations,
  studentSectionMemberships,
  teacherSectionMemberships,
} from '../db/schema/index.js';
import { hashPassword, UserRole } from '../lib/auth.js';
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  isPlatformDeveloperRole,
  isPlatformOwnerRole,
  requireRole,
} from '../middleware/auth.js';

const ALL_VALID_ROLES = new Set([
  'PLATFORM_OWNER',
  'PLATFORM_DEVELOPER',
  'PLATFORM_ADMIN',
  'ORGANIZATION_ADMIN',
  'TEACHER',
  'STUDENT',
]);

function normalizeUserRole(raw: string): UserRole {
  if (raw === 'PLATFORM_ADMIN') return 'PLATFORM_OWNER';
  return raw as UserRole;
}

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
      if (!isPlatformOwnerRole(request.user!.role)) {
        organizationId = request.user!.organizationId || undefined;
        if (!organizationId) {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(users.organizationId, organizationId));
      }
      if (role && role !== 'ALL') {
        if (role === 'PLATFORM_ADMIN' || role === 'PLATFORM_OWNER') {
          conditions.push(inArray(users.role, ['PLATFORM_OWNER', 'PLATFORM_ADMIN']));
        } else if (role === 'PLATFORM_STAFF') {
          conditions.push(
            inArray(users.role, ['PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN']),
          );
        } else {
          conditions.push(eq(users.role, role));
        }
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
      if (isPlatformOwnerRole(request.user!.role) && query.organizationId) {
        orgId = query.organizationId;
      }
      if (!orgId && !isPlatformOwnerRole(request.user!.role)) {
        return reply.send({ items: [] });
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
      if (isPlatformOwnerRole(request.user!.role) && query.organizationId) {
        orgId = query.organizationId;
      }
      if (!orgId && !isPlatformOwnerRole(request.user!.role)) {
        return reply.send({ items: [] });
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

    if (isPlatformDeveloperRole(request.user!.role) && request.user!.userId !== id) {
      throw Errors.forbidden('Platform developers cannot access user PII records');
    }
    if (request.user!.role === 'STUDENT' && request.user!.userId !== id) {
      throw Errors.forbidden('Students can only view their own profile');
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { organization: true },
    });

    if (!user) {
      throw Errors.notFound('User not found');
    }

    if (
      !isPlatformOwnerRole(request.user!.role) &&
      request.user!.userId !== user.id &&
      (!request.user!.organizationId || user.organizationId !== request.user!.organizationId)
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

      const rawRole = String(body.role).trim();
      if (!ALL_VALID_ROLES.has(rawRole)) {
        throw Errors.badRequest(`Unsupported role '${rawRole}'`);
      }
      const targetRole = normalizeUserRole(rawRole);
      const actorIsOwner = isPlatformOwnerRole(request.user!.role);

      if (!actorIsOwner && !['TEACHER', 'STUDENT'].includes(targetRole)) {
        throw Errors.forbidden(`Role '${targetRole}' can only be provisioned by a Platform Owner`);
      }

      let orgId: string | null = body.organizationId?.trim() || null;
      if (!actorIsOwner) {
        orgId = request.user!.organizationId;
      }
      if (targetRole === 'PLATFORM_OWNER' || targetRole === 'PLATFORM_DEVELOPER') {
        orgId = null;
      } else if (targetRole !== 'STUDENT' && !orgId) {
        throw Errors.badRequest(`organizationId is required for role '${targetRole}'`);
      }

      if (orgId) {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, orgId),
        });
        if (!org) throw Errors.notFound('Organization not found');
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
        organizationId: orgId,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.toLowerCase().trim(),
        role: targetRole,
        status: body.status || 'ACTIVE',
      };

      await db.insert(users).values(newUser);

      // Create credentials
      const tempPassword = body.password || 'Welcome@123';
      const passwordHash = await hashPassword(tempPassword);
      await runWithRlsContext({ systemContext: 'AUTH' }, async () => {
        await db.insert(credentials).values({
          userId,
          passwordHash,
        });
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

      const actorIsOwner = isPlatformOwnerRole(request.user!.role);
      if (
        !actorIsOwner &&
        (!request.user!.organizationId || user.organizationId !== request.user!.organizationId)
      ) {
        throw Errors.forbidden('Access denied');
      }
      if (
        !actorIsOwner &&
        user.id !== request.user!.userId &&
        ['PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN'].includes(
          user.role,
        )
      ) {
        throw Errors.forbidden('Only Platform Owners can modify administrator accounts');
      }

      const updateData: any = { updatedAt: new Date() };
      if (body.firstName !== undefined) updateData.firstName = body.firstName.trim();
      if (body.lastName !== undefined) updateData.lastName = body.lastName.trim();
      if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.role !== undefined && actorIsOwner) {
        const rawRole = String(body.role).trim();
        if (!ALL_VALID_ROLES.has(rawRole)) throw Errors.badRequest(`Unsupported role '${rawRole}'`);
        updateData.role = normalizeUserRole(rawRole);
      }

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

      const actorIsOwner = isPlatformOwnerRole(request.user!.role);
      if (
        !actorIsOwner &&
        (!request.user!.organizationId || user.organizationId !== request.user!.organizationId)
      ) {
        throw Errors.forbidden('Access denied');
      }
      if (
        !actorIsOwner &&
        ['PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN'].includes(
          user.role,
        )
      ) {
        throw Errors.forbidden('Only Platform Owners can change administrator status');
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

      const actorIsOwner = isPlatformOwnerRole(request.user!.role);
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
        const email = emailIdx >= 0 ? (parts[emailIdx] || '').toLowerCase() : '';
        const firstName = firstIdx >= 0 ? parts[firstIdx] || '' : '';
        const lastName = lastIdx >= 0 ? parts[lastIdx] || '' : '';
        const rawRole = roleIdx >= 0 && parts[roleIdx] ? parts[roleIdx].toUpperCase() : 'STUDENT';
        const role = ALL_VALID_ROLES.has(rawRole) ? normalizeUserRole(rawRole) : rawRole;

        const errors: string[] = [];
        if (!email.includes('@')) errors.push('Valid email is required');
        if (!firstName) errors.push('firstName is required');
        if (!lastName) errors.push('lastName is required');
        if (!ALL_VALID_ROLES.has(rawRole)) errors.push(`Unsupported role '${rawRole}'`);
        else if (!actorIsOwner && !['TEACHER', 'STUDENT'].includes(role)) {
          errors.push('Organization admins can only import STUDENT or TEACHER accounts');
        }

        const isValid = errors.length === 0;
        if (isValid) valid++;
        else invalid++;

        rows.push({
          rowNumber: i,
          email,
          firstName,
          lastName,
          role,
          isValid,
          errors,
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
      const { rows, organizationId: bodyOrgId } = request.body as any;
      if (!Array.isArray(rows)) throw Errors.badRequest('Rows array is required');

      const actorIsOwner = isPlatformOwnerRole(request.user!.role);
      const orgId = actorIsOwner
        ? bodyOrgId?.trim() || request.user!.organizationId || null
        : request.user!.organizationId;
      if (orgId) {
        const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
        if (!org) throw Errors.notFound('Target organization not found');
      }

      let imported = 0;
      let skipped = 0;
      const errors: Array<{ email?: string; reason: string }> = [];
      const created: Array<{ id: string; email: string; role: string }> = [];

      const defaultPassHash = await hashPassword('Welcome@123');

      for (const row of rows) {
        if (!row.isValid || !row.email || !row.firstName || !row.lastName) {
          skipped++;
          errors.push({ email: row.email, reason: 'Invalid row fields' });
          continue;
        }

        const rawRole = String(row.role || 'STUDENT')
          .trim()
          .toUpperCase();
        if (!ALL_VALID_ROLES.has(rawRole)) {
          skipped++;
          errors.push({ email: row.email, reason: `Unsupported role '${rawRole}'` });
          continue;
        }
        const targetRole = normalizeUserRole(rawRole);
        if (!actorIsOwner && !['TEACHER', 'STUDENT'].includes(targetRole)) {
          skipped++;
          errors.push({
            email: row.email,
            reason: 'Organization admins can only import STUDENT or TEACHER accounts',
          });
          continue;
        }

        const rowOrgId =
          targetRole === 'PLATFORM_OWNER' || targetRole === 'PLATFORM_DEVELOPER' ? null : orgId;
        if (
          targetRole !== 'STUDENT' &&
          !rowOrgId &&
          targetRole !== 'PLATFORM_OWNER' &&
          targetRole !== 'PLATFORM_DEVELOPER'
        ) {
          skipped++;
          errors.push({ email: row.email, reason: 'organizationId is required' });
          continue;
        }

        const existing = await db.query.users.findFirst({
          where: eq(users.email, row.email.toLowerCase().trim()),
        });

        if (existing) {
          skipped++;
          errors.push({ email: row.email, reason: 'Email already exists' });
          continue;
        }

        const userId = `usr-${uuidv4().slice(0, 8)}`;
        const cleanEmail = row.email.toLowerCase().trim();
        await db.insert(users).values({
          id: userId,
          organizationId: rowOrgId,
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: cleanEmail,
          role: targetRole,
          status: 'ACTIVE',
        });

        await runWithRlsContext({ systemContext: 'AUTH' }, async () => {
          await db.insert(credentials).values({
            userId,
            passwordHash: defaultPassHash,
          });
        });

        created.push({ id: userId, email: cleanEmail, role: targetRole });
        imported++;
      }

      return reply.send({
        imported,
        skipped,
        total: rows.length,
        errors,
        created,
      });
    },
  );
}
