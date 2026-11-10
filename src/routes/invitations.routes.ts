import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { invitations } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { requireRole } from '../middleware/auth.js';

export async function invitationRoutes(app: FastifyInstance) {
  // GET /api/invitations
  app.get(
    '/api/invitations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const status = query.status?.trim();
      const search = query.search?.trim();
      let organizationId = query.organizationId?.trim();

      if (request.user!.role !== 'PLATFORM_ADMIN') {
        organizationId = request.user!.organizationId;
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(invitations.organizationId, organizationId));
      }
      if (status && status !== 'ALL') conditions.push(eq(invitations.status, status));
      if (search) conditions.push(ilike(invitations.email, `%${search}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const list = await db.query.invitations.findMany({
        where: whereClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(invitations.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invitations)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      return reply.send({
        items: list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );

  // POST /api/invitations
  app.post(
    '/api/invitations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.email) throw Errors.badRequest('Email is required');

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }
      if (!orgId) throw Errors.badRequest('organizationId is required');

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invId = `inv-${uuidv4().slice(0, 8)}`;
      const newInv = {
        id: invId,
        organizationId: orgId,
        email: body.email.toLowerCase().trim(),
        role: body.role || 'STUDENT',
        status: 'PENDING',
        tokenHash,
        invitedBy: request.user!.userId,
        expiresAt,
      };

      await db.insert(invitations).values(newInv);
      return reply.status(201).send(newInv);
    },
  );

  // POST /api/invitations/:id/resend
  app.post(
    '/api/invitations/:id/resend',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db
        .update(invitations)
        .set({ status: 'PENDING', expiresAt })
        .where(eq(invitations.id, id));

      return reply.send({ success: true, message: 'Invitation resent' });
    },
  );

  // PATCH /api/invitations/:id/revoke
  app.patch(
    '/api/invitations/:id/revoke',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await db.update(invitations).set({ status: 'REVOKED' }).where(eq(invitations.id, id));

      return reply.send({ success: true, status: 'REVOKED' });
    },
  );
}
