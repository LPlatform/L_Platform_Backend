import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { organizations, users, classes, courses } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

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

      const conditions: any[] = [];
      if (search) {
        conditions.push(ilike(organizations.name, `%${search}%`));
      }
      if (status && status !== 'ALL') {
        conditions.push(eq(organizations.status, status));
      }

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
        orgs.map(async (org) => {
          const userCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(users)
            .where(eq(users.organizationId, org.id));
          const classCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(classes)
            .where(eq(classes.organizationId, org.id));
          const courseCount = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(courses)
            .where(eq(courses.organizationId, org.id));

          return {
            ...org,
            studentCount: userCount[0]?.count || 0,
            classCount: classCount[0]?.count || 0,
            courseCount: courseCount[0]?.count || 0,
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

    const userCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.organizationId, org.id));
    const classCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(classes)
      .where(eq(classes.organizationId, org.id));
    const courseCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courses)
      .where(eq(courses.organizationId, org.id));

    return reply.send({
      ...org,
      studentCount: userCount[0]?.count || 0,
      classCount: classCount[0]?.count || 0,
      courseCount: courseCount[0]?.count || 0,
    });
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
        description: body.description || null,
        status: body.status || 'ACTIVE',
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        address: body.address || null,
        settings: body.settings || {},
      };

      await db.insert(organizations).values(newOrg);
      return reply.status(201).send(newOrg);
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
      if (body.description !== undefined) updateData.description = body.description;
      if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail;
      if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
      if (body.address !== undefined) updateData.address = body.address;
      if (body.settings !== undefined) updateData.settings = body.settings;

      await db.update(organizations).set(updateData).where(eq(organizations.id, id));

      const updated = await db.query.organizations.findFirst({
        where: eq(organizations.id, id),
      });

      return reply.send(updated);
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

      return reply.send(updated);
    },
  );
}
