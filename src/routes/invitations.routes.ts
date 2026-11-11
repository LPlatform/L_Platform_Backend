import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'node:crypto';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { invitations, organizations } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { requireRole } from '../middleware/auth.js';

async function toInvitationDto(invitation: typeof invitations.$inferSelect) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, invitation.organizationId),
    columns: { name: true },
  });
  return {
    id: invitation.id,
    publicId: invitation.id.toUpperCase(),
    recipient: invitation.email,
    channel: invitation.channel,
    role: invitation.role,
    organizationId: invitation.organizationId,
    organizationName: organization?.name || null,
    status: invitation.status,
    invitedAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    lastSentAt: invitation.lastSentAt.toISOString(),
  };
}

async function getManagedInvitation(
  id: string,
  user: { role: string; organizationId: string | null },
) {
  const invitation = await db.query.invitations.findFirst({ where: eq(invitations.id, id) });
  if (!invitation) throw Errors.notFound('Invitation not found');
  if (user.role !== 'PLATFORM_ADMIN' && invitation.organizationId !== user.organizationId) {
    throw Errors.forbidden('You do not have access to this invitation');
  }
  return invitation;
}

export async function invitationRoutes(app: FastifyInstance) {
  app.get(
    '/api/invitations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      let organizationId = query.organizationId?.trim();
      if (request.user!.role !== 'PLATFORM_ADMIN') organizationId = request.user!.organizationId;

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(invitations.organizationId, organizationId));
      }
      if (query.status && query.status !== 'ALL')
        conditions.push(eq(invitations.status, query.status));
      if (query.role && query.role !== 'ALL') conditions.push(eq(invitations.role, query.role));
      if (query.search)
        conditions.push(ilike(invitations.email, `%${String(query.search).trim()}%`));
      const whereClause = conditions.length ? and(...conditions) : undefined;

      const [list, count] = await Promise.all([
        db.query.invitations.findMany({
          where: whereClause,
          limit: pageSize,
          offset: (page - 1) * pageSize,
          orderBy: desc(invitations.createdAt),
        }),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(invitations)
          .where(whereClause),
      ]);
      const total = count[0]?.count || 0;
      const items = await Promise.all(list.map((invitation) => toInvitationDto(invitation)));
      return reply.send({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
    },
  );

  app.post(
    '/api/invitations',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const body = request.body as any;
      const recipient = body.email ?? body.recipient;
      if (!recipient) throw Errors.badRequest('Recipient is required');
      let organizationId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') organizationId = request.user!.organizationId;
      if (!organizationId) throw Errors.badRequest('organizationId is required');
      if (!['EMAIL', 'USERNAME', undefined].includes(body.channel)) {
        throw Errors.badRequest('Unsupported invitation channel');
      }

      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });
      if (!organization) throw Errors.notFound('Organization not found');

      const tokenHash = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const [created] = await db
        .insert(invitations)
        .values({
          id: `inv-${uuidv4().slice(0, 8)}`,
          organizationId,
          email: String(recipient).trim(),
          channel: body.channel === 'USERNAME' ? 'USERNAME' : 'EMAIL',
          role: body.role || 'STUDENT',
          status: 'PENDING',
          tokenHash,
          invitedBy: request.user!.userId,
          expiresAt,
          lastSentAt: new Date(),
        })
        .returning();
      return reply.status(201).send(await toInvitationDto(created));
    },
  );

  app.post(
    '/api/invitations/:id/resend',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await getManagedInvitation(id, request.user!);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const [updated] = await db
        .update(invitations)
        .set({ status: 'PENDING', expiresAt, lastSentAt: new Date() })
        .where(eq(invitations.id, id))
        .returning();
      return reply.send(await toInvitationDto(updated));
    },
  );

  app.patch(
    '/api/invitations/:id/revoke',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await getManagedInvitation(id, request.user!);
      const [updated] = await db
        .update(invitations)
        .set({ status: 'REVOKED' })
        .where(eq(invitations.id, id))
        .returning();
      return reply.send(await toInvitationDto(updated));
    },
  );
}
