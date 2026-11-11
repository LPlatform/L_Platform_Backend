import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { organizations, users, classes, courses, auditLogs } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

async function getOrganizationStats(organizationId: string) {
  const roleCounts = await db
    .select({ role: users.role, count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .groupBy(users.role);
  const byRole = new Map(roleCounts.map((row) => [row.role, row.count]));
  const classCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(classes)
    .where(eq(classes.organizationId, organizationId));
  const courseCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(courses)
    .where(eq(courses.organizationId, organizationId));

  return {
    studentCount: byRole.get('STUDENT') || 0,
    teacherCount: byRole.get('TEACHER') || 0,
    administratorCount: byRole.get('ORGANIZATION_ADMIN') || 0,
    classCount: classCount[0]?.count || 0,
    courseCount: courseCount[0]?.count || 0,
  };
}

function toOrganizationDto(
  organization: typeof organizations.$inferSelect,
  stats: Awaited<ReturnType<typeof getOrganizationStats>>,
) {
  return {
    ...organization,
    publicId: organization.id.toUpperCase(),
    phone: organization.contactPhone || '',
    postalCode: organization.postalCode,
    stats,
  };
}

export async function organizationRoutes(app: FastifyInstance) {
  // GET /api/organizations - List organizations with counts
  app.get(
    '/api/organizations',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const search = query.search?.trim();
      const status = query.status?.trim();
      const type = query.type?.trim();

      const conditions: any[] = [];
      if (search) {
        conditions.push(ilike(organizations.name, `%${search}%`));
      }
      if (status && status !== 'ALL') {
        conditions.push(eq(organizations.status, status));
      }
      if (type && type !== 'ALL') conditions.push(eq(organizations.type, type));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const orgs = await db.query.organizations.findMany({
        where: whereClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(organizations.createdAt),
      });

      // Get count
      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      // Enhance with counts
      const items = await Promise.all(
        orgs.map(async (org) => toOrganizationDto(org, await getOrganizationStats(org.id))),
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

  // GET /api/organizations/options
  app.get('/api/organizations/options', { preHandler: [authenticate] }, async (request, reply) => {
    if (request.user!.role === 'PLATFORM_ADMIN') {
      const orgs = await db.query.organizations.findMany({
        where: eq(organizations.status, 'ACTIVE'),
        columns: { id: true, name: true, slug: true },
      });
      return reply.send(orgs);
    }

    if (request.user!.organizationId) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, request.user!.organizationId),
        columns: { id: true, name: true, slug: true },
      });
      return reply.send(org ? [org] : []);
    }

    return reply.send([]);
  });

  // GET /api/organizations/:id
  app.get('/api/organizations/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    if (!checkTenantAccess(request.user!, id)) {
      throw Errors.forbidden('You do not have access to this organization');
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });

    if (!org) {
      throw Errors.notFound('Organization not found');
    }

    return reply.send(toOrganizationDto(org, await getOrganizationStats(org.id)));
  });

  // POST /api/organizations
  app.post(
    '/api/organizations',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.name || !body.slug) {
        throw Errors.badRequest('Name and slug are required');
      }

      // Check slug uniqueness
      const existing = await db.query.organizations.findFirst({
        where: eq(organizations.slug, body.slug.toLowerCase().trim()),
      });
      if (existing) {
        throw Errors.conflict('An organization with this slug already exists');
      }

      const id = `org-${uuidv4().slice(0, 8)}`;
      const newOrg = {
        id,
        name: body.name.trim(),
        slug: body.slug.toLowerCase().trim(),
        type: body.type || 'SCHOOL',
        description: body.description || null,
        status: body.status || 'ACTIVE',
        contactName: body.contactName || '',
        contactEmail: body.contactEmail || null,
        contactPhone: body.phone || body.contactPhone || null,
        address: body.address || null,
        city: body.city || '',
        state: body.state || '',
        country: body.country || '',
        postalCode: body.postalCode || '',
        settings: body.settings || {},
      };

      const [created] = await db.insert(organizations).values(newOrg).returning();
      await db.insert(auditLogs).values({
        id: `aud-${uuidv4()}`,
        organizationId: id,
        userId: request.user!.userId,
        userEmail: request.user!.email,
        action: 'ORGANIZATION_CREATED',
        entityType: 'ORGANIZATION',
        entityId: id,
        details: { name: created.name, slug: created.slug },
      });
      return reply.status(201).send(toOrganizationDto(created, await getOrganizationStats(id)));
    },
  );

  // PATCH /api/organizations/:id
  app.patch(
    '/api/organizations/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      if (!checkTenantAccess(request.user!, id)) {
        throw Errors.forbidden('You do not have permission to modify this organization');
      }

      const body = request.body as any;
      const updateData: any = { updatedAt: new Date() };

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.type !== undefined) updateData.type = body.type;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.contactName !== undefined) updateData.contactName = body.contactName;
      if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
      if (body.phone !== undefined) updateData.contactPhone = body.phone;
      if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.city !== undefined) updateData.city = body.city;
      if (body.state !== undefined) updateData.state = body.state;
      if (body.country !== undefined) updateData.country = body.country;
      if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
      if (body.settings !== undefined) updateData.settings = body.settings;

      await db.update(organizations).set(updateData).where(eq(organizations.id, id));

      const updated = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
      });

      return reply.send(
        updated ? toOrganizationDto(updated, await getOrganizationStats(id)) : null,
      );
    },
  );

  // PATCH /api/organizations/:id/status
  app.patch(
    '/api/organizations/:id/status',
    { preHandler: [requireRole('PLATFORM_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        throw Errors.badRequest('Invalid status');
      }

      await db
        .update(organizations)
        .set({ status, updatedAt: new Date() })
        .where(eq(organizations.id, id));

      const updated = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
      });

      return reply.send(
        updated ? toOrganizationDto(updated, await getOrganizationStats(id)) : null,
      );
    },
  );
}
