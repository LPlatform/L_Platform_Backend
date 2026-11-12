import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, asc, or, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { questionOptions, questions, testCases } from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  isPlatformDeveloperRole,
  isPlatformOwnerRole,
  requireRole,
} from '../middleware/auth.js';

function sanitizeQuestionForUser(
  q: typeof questions.$inferSelect,
  opts: Array<typeof questionOptions.$inferSelect>,
  isStudent: boolean,
) {
  if (!isStudent) {
    return {
      ...q,
      options: opts.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        orderNum: opt.orderNum,
        isCorrect: opt.isCorrect,
      })),
    };
  }
  return {
    id: q.id,
    organizationId: q.organizationId,
    courseId: q.courseId,
    title: q.title,
    description: q.description,
    inputFormat: q.inputFormat,
    outputFormat: q.outputFormat,
    constraints: q.constraints,
    examples: q.examples,
    difficulty: q.difficulty,
    topic: q.topic,
    supportedLanguages: q.supportedLanguages,
    marks: q.marks,
    questionType: q.questionType,
    courseModuleId: q.courseModuleId,
    lessonId: q.lessonId,
    learningObjective: q.learningObjective,
    sourcePage: q.sourcePage,
    sourceReference: q.sourceReference,
    estimatedMinutes: q.estimatedMinutes,
    status: q.status,
    options: opts.map((opt) => ({
      id: opt.id,
      optionText: opt.optionText,
      orderNum: opt.orderNum,
    })),
  };
}

export async function questionRoutes(app: FastifyInstance) {
  // GET /api/questions
  app.get('/api/questions', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(500, parseInt(query.pageSize || '20', 10)));
    const search = query.search?.trim();
    const difficulty = query.difficulty?.trim();
    const topic = query.topic?.trim();
    const courseId = query.courseId?.trim();
    const questionType = query.questionType?.trim();
    const courseModuleId = query.courseModuleId?.trim();
    const status = query.status?.trim();

    const user = request.user!;
    const isOwner = isPlatformOwnerRole(user.role);
    const isDev = isPlatformDeveloperRole(user.role);
    const isStudent = user.role === 'STUDENT';

    const conditions: any[] = [];
    if (isOwner) {
      if (query.organizationId && query.organizationId !== 'ALL') {
        conditions.push(eq(questions.organizationId, query.organizationId));
      }
    } else if (isDev) {
      conditions.push(sql`organization_id IS NULL`);
    } else {
      conditions.push(
        user.organizationId
          ? or(eq(questions.organizationId, user.organizationId), sql`organization_id IS NULL`)
          : sql`organization_id IS NULL`,
      );
      if (isStudent) {
        conditions.push(inArray(questions.status, ['ACTIVE', 'PUBLISHED']));
      }
    }

    if (difficulty && difficulty !== 'ALL') conditions.push(eq(questions.difficulty, difficulty));
    if (topic && topic !== 'ALL') conditions.push(eq(questions.topic, topic));
    if (courseId && courseId !== 'ALL') conditions.push(eq(questions.courseId, courseId));
    if (questionType && questionType !== 'ALL') {
      conditions.push(eq(questions.questionType, questionType));
    }
    if (courseModuleId && courseModuleId !== 'ALL') {
      conditions.push(eq(questions.courseModuleId, courseModuleId));
    }
    if (!isStudent && status && status !== 'ALL') conditions.push(eq(questions.status, status));
    if (search) {
      conditions.push(
        or(
          ilike(questions.title, `%${search}%`),
          ilike(questions.description, `%${search}%`),
          ilike(questions.topic, `%${search}%`),
        ),
      );
    }

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

    const qIds = list.map((q) => q.id);
    const [tcRows, optRows] = await Promise.all([
      qIds.length
        ? db
            .select({
              questionId: testCases.questionId,
              isHidden: testCases.isHidden,
              isSample: testCases.isSample,
            })
            .from(testCases)
            .where(inArray(testCases.questionId, qIds))
        : [],
      qIds.length
        ? db
            .select()
            .from(questionOptions)
            .where(inArray(questionOptions.questionId, qIds))
            .orderBy(asc(questionOptions.orderNum))
        : [],
    ]);

    const tcCountByQ = new Map<string, number>();
    for (const tc of tcRows) {
      if (isStudent && (tc.isHidden || !tc.isSample)) continue;
      tcCountByQ.set(tc.questionId, (tcCountByQ.get(tc.questionId) ?? 0) + 1);
    }
    const optsByQ = new Map<string, Array<typeof questionOptions.$inferSelect>>();
    for (const opt of optRows) {
      const existing = optsByQ.get(opt.questionId) ?? [];
      existing.push(opt);
      optsByQ.set(opt.questionId, existing);
    }

    const items = list.map((q) => ({
      ...sanitizeQuestionForUser(q, optsByQ.get(q.id) ?? [], isStudent),
      testCaseCount: tcCountByQ.get(q.id) ?? 0,
    }));

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

    const user = request.user!;
    const isOwner = isPlatformOwnerRole(user.role);
    const isDev = isPlatformDeveloperRole(user.role);
    const isStudent = user.role === 'STUDENT';

    if (!isOwner) {
      if (isDev && q.organizationId !== null) {
        throw Errors.forbidden('Platform developers can only access platform questions');
      }
      if (!isDev && q.organizationId !== null && q.organizationId !== user.organizationId) {
        throw Errors.forbidden('Access denied to this question');
      }
      if (isStudent && !['ACTIVE', 'PUBLISHED'].includes(q.status)) {
        throw Errors.forbidden('Question is not published');
      }
    }

    const [allTc, opts] = await Promise.all([
      db.query.testCases.findMany({
        where: eq(testCases.questionId, id),
        orderBy: [testCases.orderNum],
      }),
      db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, id))
        .orderBy(asc(questionOptions.orderNum)),
    ]);

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
      ...sanitizeQuestionForUser(q, opts, isStudent),
      testCases: sanitizedTestCases,
    });
  });

  // POST /api/questions
  app.post(
    '/api/questions',
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
      const body = request.body as any;
      if (!body.title || !body.description) {
        throw Errors.badRequest('Title and description are required');
      }

      const user = request.user!;
      let orgId: string | null = body.organizationId || null;
      if (isPlatformDeveloperRole(user.role)) {
        if (body.organizationId) {
          throw Errors.forbidden('Platform developers cannot author organization-scoped questions');
        }
        orgId = null;
      } else if (!isPlatformOwnerRole(user.role)) {
        if (!user.organizationId) {
          throw Errors.forbidden('Organization membership required to author school questions');
        }
        orgId = user.organizationId;
      }

      const qId = `qst-${uuidv4().slice(0, 8)}`;
      const newQuestion = {
        id: qId,
        organizationId: orgId,
        courseId: body.courseId || null,
        createdBy: user.userId,
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
        questionType: body.questionType || 'PROGRAMMING',
        courseModuleId: body.courseModuleId || null,
        lessonId: body.lessonId || null,
        learningObjective: body.learningObjective || null,
        sourcePage: body.sourcePage ?? null,
        sourceReference: body.sourceReference || null,
        answerKey: body.answerKey ?? null,
        rubric: body.rubric ?? null,
        estimatedMinutes: body.estimatedMinutes ?? 5,
        negativeMarks: body.negativeMarks ?? 0,
        allowPartialCredit: Boolean(body.allowPartialCredit),
        status: body.status || 'PUBLISHED',
      };

      await db.insert(questions).values(newQuestion);

      if (Array.isArray(body.options)) {
        for (let i = 0; i < body.options.length; i++) {
          const opt = body.options[i];
          await db.insert(questionOptions).values({
            id: opt.id || `opt-${uuidv4().slice(0, 8)}`,
            questionId: qId,
            optionText: String(opt.optionText ?? opt.text ?? '').trim(),
            orderNum: opt.orderNum ?? i + 1,
            isCorrect: Boolean(opt.isCorrect),
          });
        }
      }

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

      const q = await db.query.questions.findFirst({ where: eq(questions.id, id) });
      if (!q) throw Errors.notFound('Question not found');

      const user = request.user!;
      if (!isPlatformOwnerRole(user.role)) {
        if (q.organizationId === null) {
          if (!isPlatformDeveloperRole(user.role)) {
            throw Errors.forbidden('Only platform staff can modify platform bank questions');
          }
        } else if (isPlatformDeveloperRole(user.role) || q.organizationId !== user.organizationId) {
          throw Errors.forbidden('Access denied to modify this question');
        }
      }

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
      if (body.questionType !== undefined) updateData.questionType = body.questionType;
      if (body.courseModuleId !== undefined) updateData.courseModuleId = body.courseModuleId;
      if (body.lessonId !== undefined) updateData.lessonId = body.lessonId;
      if (body.learningObjective !== undefined)
        updateData.learningObjective = body.learningObjective;
      if (body.sourcePage !== undefined) updateData.sourcePage = body.sourcePage;
      if (body.sourceReference !== undefined) updateData.sourceReference = body.sourceReference;
      if (body.answerKey !== undefined) updateData.answerKey = body.answerKey;
      if (body.rubric !== undefined) updateData.rubric = body.rubric;
      if (body.estimatedMinutes !== undefined) updateData.estimatedMinutes = body.estimatedMinutes;
      if (body.negativeMarks !== undefined) updateData.negativeMarks = body.negativeMarks;
      if (body.allowPartialCredit !== undefined)
        updateData.allowPartialCredit = Boolean(body.allowPartialCredit);

      await db.update(questions).set(updateData).where(eq(questions.id, id));
      if (Array.isArray(body.options)) {
        await db.delete(questionOptions).where(eq(questionOptions.questionId, id));
        for (let i = 0; i < body.options.length; i++) {
          const opt = body.options[i];
          await db.insert(questionOptions).values({
            id: opt.id || `opt-${uuidv4().slice(0, 8)}`,
            questionId: id,
            optionText: String(opt.optionText ?? opt.text ?? '').trim(),
            orderNum: opt.orderNum ?? i + 1,
            isCorrect: Boolean(opt.isCorrect),
          });
        }
      }

      const [updated, updatedOpts] = await Promise.all([
        db.query.questions.findFirst({ where: eq(questions.id, id) }),
        db
          .select()
          .from(questionOptions)
          .where(eq(questionOptions.questionId, id))
          .orderBy(asc(questionOptions.orderNum)),
      ]);
      return reply.send(updated ? { ...updated, options: updatedOpts } : null);
    },
  );

  // DELETE /api/questions/:id
  app.delete(
    '/api/questions/:id',
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
      const q = await db.query.questions.findFirst({ where: eq(questions.id, id) });
      if (!q) throw Errors.notFound('Question not found');

      const user = request.user!;
      if (!isPlatformOwnerRole(user.role)) {
        if (q.organizationId === null) {
          if (!isPlatformDeveloperRole(user.role)) {
            throw Errors.forbidden('Only platform staff can delete platform bank questions');
          }
        } else if (isPlatformDeveloperRole(user.role) || q.organizationId !== user.organizationId) {
          throw Errors.forbidden('Access denied to delete this question');
        }
      }

      await db.delete(questions).where(eq(questions.id, id));
      return reply.send({ success: true });
    },
  );
}
