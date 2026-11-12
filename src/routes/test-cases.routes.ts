import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { testCases, questions } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { isPlatformDeveloperRole, isPlatformOwnerRole, requireRole } from '../middleware/auth.js';

async function assertQuestionAccess(
  user: { role: any; organizationId: string | null },
  questionId: string,
  requireWrite: boolean,
) {
  const q = await db.query.questions.findFirst({ where: eq(questions.id, questionId) });
  if (!q) throw Errors.notFound('Question not found');
  if (isPlatformOwnerRole(user.role)) return q;
  if (isPlatformDeveloperRole(user.role)) {
    if (q.organizationId !== null) {
      throw Errors.forbidden('Platform developers can only access platform question test cases');
    }
    return q;
  }
  if (q.organizationId === null) {
    if (requireWrite) {
      throw Errors.forbidden('Only platform staff can modify platform bank test cases');
    }
    return q;
  }
  if (!user.organizationId || q.organizationId !== user.organizationId) {
    throw Errors.forbidden('Access denied to this question test cases');
  }
  return q;
}

export async function testCaseRoutes(app: FastifyInstance) {
  // GET /api/questions/:questionId/test-cases - Only teachers and admins!
  app.get(
    '/api/questions/:questionId/test-cases',
    {
      preHandler: [
        requireRole(
          'PLATFORM_OWNER',
          'PLATFORM_DEVELOPER',
          'PLATFORM_ADMIN',
          'ORGANIZATION_ADMIN',
          'TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      await assertQuestionAccess(request.user!, questionId, false);

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
    {
      preHandler: [
        requireRole(
          'PLATFORM_OWNER',
          'PLATFORM_DEVELOPER',
          'PLATFORM_ADMIN',
          'ORGANIZATION_ADMIN',
          'TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const body = request.body as any;

      if (body.input === undefined || body.expectedOutput === undefined) {
        throw Errors.badRequest('Input and expectedOutput are required');
      }

      await assertQuestionAccess(request.user!, questionId, true);

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
    {
      preHandler: [
        requireRole(
          'PLATFORM_OWNER',
          'PLATFORM_DEVELOPER',
          'PLATFORM_ADMIN',
          'ORGANIZATION_ADMIN',
          'TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const tc = await db.query.testCases.findFirst({ where: eq(testCases.id, id) });
      if (!tc) throw Errors.notFound('Test case not found');
      await assertQuestionAccess(request.user!, tc.questionId, true);

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
    {
      preHandler: [
        requireRole(
          'PLATFORM_OWNER',
          'PLATFORM_DEVELOPER',
          'PLATFORM_ADMIN',
          'ORGANIZATION_ADMIN',
          'TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const tc = await db.query.testCases.findFirst({ where: eq(testCases.id, id) });
      if (!tc) throw Errors.notFound('Test case not found');
      await assertQuestionAccess(request.user!, tc.questionId, true);

      await db.delete(testCases).where(eq(testCases.id, id));
      return reply.send({ success: true });
    },
  );

  // POST /api/questions/:questionId/test-cases/reorder
  app.post(
    '/api/questions/:questionId/test-cases/reorder',
    {
      preHandler: [
        requireRole(
          'PLATFORM_OWNER',
          'PLATFORM_DEVELOPER',
          'PLATFORM_ADMIN',
          'ORGANIZATION_ADMIN',
          'TEACHER',
        ),
      ],
    },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const { orderIds } = request.body as { orderIds: string[] };

      if (!Array.isArray(orderIds)) throw Errors.badRequest('orderIds array is required');
      await assertQuestionAccess(request.user!, questionId, true);

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
