import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { questions, testCases, users } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

export async function questionRoutes(app: FastifyInstance) {
  // GET /api/questions
  app.get('/api/questions', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const search = query.search?.trim();
    const difficulty = query.difficulty?.trim();
    const topic = query.topic?.trim();
    const courseId = query.courseId?.trim();

    const conditions: any[] = [];
    if (request.user!.role !== 'PLATFORM_ADMIN') {
      conditions.push(
        or(
          eq(questions.organizationId, request.user!.organizationId!),
          sql`organization_id IS NULL`,
        ),
      );
    }
    if (difficulty && difficulty !== 'ALL') conditions.push(eq(questions.difficulty, difficulty));
    if (topic && topic !== 'ALL') conditions.push(eq(questions.topic, topic));
    if (courseId) conditions.push(eq(questions.courseId, courseId));
    if (search) conditions.push(ilike(questions.title, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.questions.findMany({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(questions.createdAt),
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questions)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    const items = await Promise.all(
      list.map(async (q) => {
        const tcCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(testCases)
          .where(eq(testCases.questionId, q.id));

        return {
          ...q,
          testCaseCount: tcCount[0]?.count || 0,
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
  });

  // GET /api/questions/:id
  app.get('/api/questions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const q = await db.query.questions.findFirst({
      where: eq(questions.id, id),
    });

    if (!q) throw Errors.notFound('Question not found');

    const isStudent = request.user!.role === 'STUDENT';

    // Test cases: if student, ONLY return sample/non-hidden test cases!
    const allTc = await db.query.testCases.findMany({
      where: eq(testCases.questionId, id),
      orderBy: [testCases.orderNum],
    });

    const sanitizedTestCases = isStudent
      ? allTc
          .filter((tc) => !tc.isHidden && tc.isSample)
          .map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isSample: true,
            orderNum: tc.orderNum,
            timeLimitMs: tc.timeLimitMs,
            memoryLimitMb: tc.memoryLimitMb,
          }))
      : allTc;

    return reply.send({
      ...q,
      testCases: sanitizedTestCases,
    });
  });

  // POST /api/questions
  app.post(
    '/api/questions',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.title || !body.description) {
        throw Errors.badRequest('Title and description are required');
      }

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }

      const qId = `qst-${uuidv4().slice(0, 8)}`;
      const newQuestion = {
        id: qId,
        organizationId: orgId || null,
        courseId: body.courseId || null,
        createdBy: request.user!.userId,
        title: body.title.trim(),
        description: body.description.trim(),
        inputFormat: body.inputFormat || null,
        outputFormat: body.outputFormat || null,
        constraints: body.constraints || null,
        examples: body.examples || [],
        explanation: body.explanation || null,
        difficulty: body.difficulty || 'EASY',
        topic: body.topic || 'General',
        supportedLanguages: body.supportedLanguages || ['PYTHON', 'JAVA', 'CPP'],
        marks: body.marks || 10,
        status: body.status || 'PUBLISHED',
      };

      await db.insert(questions).values(newQuestion);

      // If initial test cases were provided
      if (Array.isArray(body.testCases)) {
        for (let i = 0; i < body.testCases.length; i++) {
          const tc = body.testCases[i];
          await db.insert(testCases).values({
            id: `tc-${uuidv4().slice(0, 8)}`,
            questionId: qId,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: !!tc.isHidden,
            isSample: !!tc.isSample,
            orderNum: i + 1,
            timeLimitMs: tc.timeLimitMs || 2000,
            memoryLimitMb: tc.memoryLimitMb || 128,
          });
        }
      }

      return reply.status(201).send(newQuestion);
    },
  );

  // PATCH /api/questions/:id
  app.patch(
    '/api/questions/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const q = await db.query.questions.findFirst({ where: eq(questions.id, id) });
      if (!q) throw Errors.notFound('Question not found');

      const updateData: any = { updatedAt: new Date() };
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description.trim();
      if (body.inputFormat !== undefined) updateData.inputFormat = body.inputFormat;
      if (body.outputFormat !== undefined) updateData.outputFormat = body.outputFormat;
      if (body.constraints !== undefined) updateData.constraints = body.constraints;
      if (body.examples !== undefined) updateData.examples = body.examples;
      if (body.explanation !== undefined) updateData.explanation = body.explanation;
      if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
      if (body.topic !== undefined) updateData.topic = body.topic;
      if (body.supportedLanguages !== undefined)
        updateData.supportedLanguages = body.supportedLanguages;
      if (body.marks !== undefined) updateData.marks = body.marks;
      if (body.status !== undefined) updateData.status = body.status;

      await db.update(questions).set(updateData).where(eq(questions.id, id));
      const updated = await db.query.questions.findFirst({ where: eq(questions.id, id) });
      return reply.send(updated);
    },
  );

  // DELETE /api/questions/:id
  app.delete(
    '/api/questions/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      await db.delete(questions).where(eq(questions.id, id));
      return reply.send({ success: true });
    },
  );
}
