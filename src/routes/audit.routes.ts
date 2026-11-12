import { FastifyInstance } from 'fastify';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { auditLogs, organizations, users } from '../db/schema/index.js';
import { isPlatformOwnerRole, requireRole } from '../middleware/auth.js';

export async function auditRoutes(app: FastifyInstance) {
  // GET /api/audit-logs
  app.get(
    '/api/audit-logs',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN')] },
    async (request, reply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page || '1', 10));
      const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
      const action = query.action?.trim();
      const entityType = query.entityType?.trim();
      const search = query.search?.trim();
      let organizationId = query.organizationId?.trim();

      if (!isPlatformOwnerRole(request.user!.role)) {
        organizationId = request.user!.organizationId || undefined;
        if (!organizationId) {
          return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
        }
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(auditLogs.organizationId, organizationId));
      }
      if (action && action !== 'ALL') conditions.push(eq(auditLogs.action, action));
      if (entityType && entityType !== 'ALL') conditions.push(eq(auditLogs.entityType, entityType));
      if (search)
        conditions.push(
          or(
            ilike(auditLogs.userEmail, `%${search}%`),
            ilike(auditLogs.action, `%${search}%`),
            ilike(auditLogs.entityType, `%${search}%`),
            ilike(auditLogs.entityId, `%${search}%`),
            sql`${auditLogs.details}::text ILIKE ${`%${search}%`}`,
          ),
        );

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const list = await db.query.auditLogs.findMany({
        where: whereClause,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: desc(auditLogs.createdAt),
      });

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause);
      const total = totalResult[0]?.count || 0;

      const items = await Promise.all(
        list.map(async (entry) => {
          const [actor, organization] = await Promise.all([
            entry.userId
              ? db.query.users.findFirst({ where: eq(users.id, entry.userId) })
              : undefined,
            entry.organizationId
              ? db.query.organizations.findFirst({
                  where: eq(organizations.id, entry.organizationId),
                })
              : undefined,
          ]);
          const details = (entry.details ?? {}) as Record<string, unknown>;
          return {
            id: entry.id,
            actorId: entry.userId ?? 'system',
            actorName: actor
              ? `${actor.firstName} ${actor.lastName}`.trim()
              : (entry.userEmail ?? 'System'),
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId ?? '',
            entityLabel: String(
              details.name ?? details.title ?? entry.entityId ?? entry.entityType,
            ),
            organizationId: entry.organizationId,
            organizationName: organization?.name ?? null,
            status: 'SUCCESS' as const,
            metadata: details,
            correlationId: entry.id,
            createdAt: entry.createdAt.toISOString(),
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
}
