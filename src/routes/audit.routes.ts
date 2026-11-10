import { FastifyInstance } from 'fastify';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { auditLogs } from '../db/schema/index.js';
import { requireRole } from '../middleware/auth.js';

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

      if (request.user!.role !== 'PLATFORM_ADMIN') {
        organizationId = request.user!.organizationId;
      }

      const conditions: any[] = [];
      if (organizationId && organizationId !== 'ALL') {
        conditions.push(eq(auditLogs.organizationId, organizationId));
      }
      if (action && action !== 'ALL') conditions.push(eq(auditLogs.action, action));
      if (entityType && entityType !== 'ALL') conditions.push(eq(auditLogs.entityType, entityType));
      if (search) conditions.push(ilike(auditLogs.userEmail, `%${search}%`));

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

      return reply.send({
        items: list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );
}

