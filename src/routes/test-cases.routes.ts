import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { testCases, questions } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { requireRole } from '../middleware/auth.js';

export async function testCaseRoutes(app: FastifyInstance) {
  // GET /api/questions/:questionId/test-cases - Only teachers and admins!
  app.get(
    '/api/questions/:questionId/test-cases',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };

      const list = await db.query.testCases.findMany({
        where: eq(testCases.questionId, questionId),
        orderBy: [testCases.orderNum],
      });

      return reply.send(list);
    },
  );

  // POST /api/questions/:questionId/test-cases
  app.post(
    '/api/questions/:questionId/test-cases',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const body = request.body as any;

      if (body.input === undefined || body.expectedOutput === undefined) {
        throw Errors.badRequest('Input and expectedOutput are required');
      }

      const q = await db.query.questions.findFirst({ where: eq(questions.id, questionId) });
      if (!q) throw Errors.notFound('Question not found');

      const existing = await db.query.testCases.findMany({
        where: eq(testCases.questionId, questionId),
      });

      const tcId = `tc-${uuidv4().slice(0, 8)}`;
      const newTestCase = {
        id: tcId,
        questionId,
        input: body.input,
        expectedOutput: body.expectedOutput,
        isHidden: !!body.isHidden,
        isSample: !!body.isSample,
        orderNum: body.orderNum || existing.length + 1,
        timeLimitMs: body.timeLimitMs || 2000,
        memoryLimitMb: body.memoryLimitMb || 128,
      };

      await db.insert(testCases).values(newTestCase);
      return reply.status(201).send(newTestCase);
    },
  );

  // PATCH /api/test-cases/:id
  app.patch(
    '/api/test-cases/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const tc = await db.query.testCases.findFirst({ where: eq(testCases.id, id) });
      if (!tc) throw Errors.notFound('Test case not found');

      const updateData: any = { updatedAt: new Date() };
      if (body.input !== undefined) updateData.input = body.input;
      if (body.expectedOutput !== undefined) updateData.expectedOutput = body.expectedOutput;
      if (body.isHidden !== undefined) updateData.isHidden = body.isHidden;
      if (body.isSample !== undefined) updateData.isSample = body.isSample;
      if (body.orderNum !== undefined) updateData.orderNum = body.orderNum;
      if (body.timeLimitMs !== undefined) updateData.timeLimitMs = body.timeLimitMs;
      if (body.memoryLimitMb !== undefined) updateData.memoryLimitMb = body.memoryLimitMb;

      await db.update(testCases).set(updateData).where(eq(testCases.id, id));
      const updated = await db.query.testCases.findFirst({ where: eq(testCases.id, id) });
      return reply.send(updated);
    },
  );

  // DELETE /api/test-cases/:id
  app.delete(
    '/api/test-cases/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.delete(testCases).where(eq(testCases.id, id));
      return reply.send({ success: true });
    },
  );

  // POST /api/questions/:questionId/test-cases/reorder
  app.post(
    '/api/questions/:questionId/test-cases/reorder',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const { orderIds } = request.body as { orderIds: string[] };

      if (!Array.isArray(orderIds)) throw Errors.badRequest('orderIds array is required');

      for (let i = 0; i < orderIds.length; i++) {
        await db
          .update(testCases)
          .set({ orderNum: i + 1, updatedAt: new Date() })
          .where(and(eq(testCases.id, orderIds[i]), eq(testCases.questionId, questionId)));
      }

      return reply.send({ success: true });
    },
  );
}
