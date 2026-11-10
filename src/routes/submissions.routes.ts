import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  submissions,
  submissionResults,
  testCases,
  questions,
  assignments,
  users,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { evaluateSubmission, TestCasePayload } from '../services/evaluator.service.js';

export async function submissionRoutes(app: FastifyInstance) {
  // POST /api/submissions - Submit code
  app.post('/api/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as any;
    const user = request.user!;

    if (!body.assignmentId || !body.questionId || !body.code || !body.language) {
      throw Errors.badRequest('Missing required fields: assignmentId, questionId, code, language');
    }

    if (!['PYTHON', 'JAVA', 'CPP'].includes(body.language)) {
      throw Errors.badRequest('Unsupported language. Allowed: PYTHON, JAVA, CPP');
    }

    const subId = `sub-${uuidv4().slice(0, 8)}`;

    // Insert pending submission
    await db.insert(submissions).values({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      code: body.code,
      language: body.language,
      status: 'EVALUATING',
    });

    // Load test cases
    const allTc = await db.query.testCases.findMany({
      where: eq(testCases.questionId, body.questionId),
      orderBy: [testCases.orderNum],
    });

    const tcPayloads: TestCasePayload[] = allTc.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      isSample: tc.isSample,
      timeLimitMs: tc.timeLimitMs,
      memoryLimitMb: tc.memoryLimitMb,
    }));

    // Evaluate
    const evalResult = await evaluateSubmission(body.code, body.language, tcPayloads);

    // Update submission
    await db
      .update(submissions)
      .set({
        status: evalResult.status,
        score: evalResult.score,
        totalTestCases: evalResult.totalTestCases,
        passedTestCases: evalResult.passedTestCases,
        evaluatedAt: new Date(),
      })
      .where(eq(submissions.id, subId));

    // Persist test case results
    for (const r of evalResult.results) {
      await db.insert(submissionResults).values({
        id: `sr-${uuidv4().slice(0, 8)}`,
        submissionId: subId,
        testCaseId: r.testCaseId,
        status: r.status,
        actualOutput: r.actualOutput,
        executionTimeMs: r.executionTimeMs,
        memoryUsedKb: r.memoryUsedKb,
        errorMessage: r.errorMessage,
      });
    }

    // Prepare response (Sanitize hidden test cases for students!)
    const tcMap = new Map(allTc.map((tc) => [tc.id, tc]));
    const isStudent = user.role === 'STUDENT';

    const sanitizedResults = evalResult.results.map((r) => {
      const tc = tcMap.get(r.testCaseId);
      const isHidden = tc?.isHidden ?? false;

      if (isStudent && isHidden) {
        return {
          testCaseId: r.testCaseId,
          status: r.status,
          executionTimeMs: r.executionTimeMs,
          isHidden: true,
          isSample: false,
          actualOutput: null, // Hidden test output NEVER exposed to student
          errorMessage: null,
        };
      }

      return {
        ...r,
        isHidden,
        isSample: tc?.isSample ?? false,
      };
    });

    return reply.status(201).send({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      language: body.language,
      status: evalResult.status,
      score: evalResult.score,
      totalTestCases: evalResult.totalTestCases,
      passedTestCases: evalResult.passedTestCases,
      results: sanitizedResults,
    });
  });

  // GET /api/submissions/:id
  app.get('/api/submissions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    const sub = await db.query.submissions.findFirst({
      where: eq(submissions.id, id),
    });

    if (!sub) throw Errors.notFound('Submission not found');

    if (user.role === 'STUDENT' && sub.studentId !== user.userId) {
      throw Errors.forbidden('Access denied');
    }

    const results = await db.query.submissionResults.findMany({
      where: eq(submissionResults.submissionId, id),
    });

    const allTc = await db.query.testCases.findMany({
      where: eq(testCases.questionId, sub.questionId),
    });
    const tcMap = new Map(allTc.map((tc) => [tc.id, tc]));

    const isStudent = user.role === 'STUDENT';

    const sanitizedResults = results.map((r) => {
      const tc = tcMap.get(r.testCaseId);
      const isHidden = tc?.isHidden ?? false;

      if (isStudent && isHidden) {
        return {
          id: r.id,
          testCaseId: r.testCaseId,
          status: r.status,
          executionTimeMs: r.executionTimeMs,
          isHidden: true,
          isSample: false,
          actualOutput: null,
          errorMessage: null,
        };
      }

      return {
        ...r,
        isHidden,
        isSample: tc?.isSample ?? false,
      };
    });

    return reply.send({
      ...sub,
      results: sanitizedResults,
    });
  });

  // GET /api/submissions
  app.get('/api/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const assignmentId = query.assignmentId?.trim();
    const questionId = query.questionId?.trim();
    let studentId = query.studentId?.trim();

    const user = request.user!;

    if (user.role === 'STUDENT') {
      studentId = user.userId; // Students can only view their own
    }

    const conditions: any[] = [];
    if (assignmentId) conditions.push(eq(submissions.assignmentId, assignmentId));
    if (questionId) conditions.push(eq(submissions.questionId, questionId));
    if (studentId) conditions.push(eq(submissions.studentId, studentId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.submissions.findMany({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(submissions.submittedAt),
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(submissions)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    const items = await Promise.all(
      list.map(async (s) => {
        const student = await db.query.users.findFirst({
          where: eq(users.id, s.studentId),
        });
        const q = await db.query.questions.findFirst({
          where: eq(questions.id, s.questionId),
        });
        const asg = await db.query.assignments.findFirst({
          where: eq(assignments.id, s.assignmentId),
        });

        return {
          ...s,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          studentEmail: student?.email || '',
          questionTitle: q?.title || 'Unknown Question',
          assignmentTitle: asg?.title || 'Unknown Assignment',
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
}
