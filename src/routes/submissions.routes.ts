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
  assignmentQuestions,
  studentSectionMemberships,
  teacherSectionMemberships,
  users,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';

export async function submissionRoutes(app: FastifyInstance) {
  // POST /api/submissions - Submit code
  app.post('/api/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as any;
    const user = request.user!;

    if (!body.assignmentId || !body.questionId || typeof body.code !== 'string' || !body.code.trim() || !body.language) {
      throw Errors.badRequest('Missing required fields: assignmentId, questionId, code, language');
    }

    if (!['PYTHON', 'JAVA', 'CPP'].includes(body.language)) {
      throw Errors.badRequest('Unsupported language. Allowed: PYTHON, JAVA, CPP');
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, body.assignmentId),
    });
    if (!assignment) throw Errors.notFound('Assignment not found');

    const linkedQuestion = await db.query.assignmentQuestions.findFirst({
      where: and(
        eq(assignmentQuestions.assignmentId, assignment.id),
        eq(assignmentQuestions.questionId, body.questionId),
      ),
    });
    if (!linkedQuestion) throw Errors.badRequest('Question is not part of this assignment');

    if (user.role === 'STUDENT') {
      if (!['PUBLISHED', 'CLOSED'].includes(assignment.status)) {
        throw Errors.forbidden('This assignment is not available for submission');
      }
      const membership = await db.query.studentSectionMemberships.findFirst({
        where: and(
          eq(studentSectionMemberships.sectionId, assignment.sectionId),
          eq(studentSectionMemberships.studentId, user.userId),
          eq(studentSectionMemberships.status, 'ACTIVE'),
        ),
      });
      if (!membership) throw Errors.forbidden('You are not enrolled in this assignment section');
    } else if (user.role === 'TEACHER') {
      const membership = await db.query.teacherSectionMemberships.findFirst({
        where: and(
          eq(teacherSectionMemberships.sectionId, assignment.sectionId),
          eq(teacherSectionMemberships.teacherId, user.userId),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      });
      if (!membership) throw Errors.forbidden('You are not assigned to this section');
    } else if (user.role === 'ORGANIZATION_ADMIN' && assignment.organizationId !== user.organizationId) {
      throw Errors.forbidden('Access denied');
    }

    const subId = `sub-${uuidv4().slice(0, 8)}`;

    // Keep new submissions pending until a separately isolated execution worker is available.
    // Never execute untrusted source code in the API process.
    await db.insert(submissions).values({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      code: body.code,
      language: body.language,
      status: 'PENDING',
    });

    return reply.status(202).send({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      language: body.language,
      status: 'PENDING',
      score: null,
      totalTestCases: 0,
      passedTestCases: 0,
      results: [],
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

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, sub.assignmentId),
    });
    if (!assignment) throw Errors.notFound('Assignment not found');

    if (user.role === 'STUDENT' && sub.studentId !== user.userId) {
      throw Errors.forbidden('Access denied');
    }
    if (user.role === 'ORGANIZATION_ADMIN' && assignment.organizationId !== user.organizationId) {
      throw Errors.forbidden('Access denied');
    }
    if (user.role === 'TEACHER') {
      const membership = await db.query.teacherSectionMemberships.findFirst({
        where: and(
          eq(teacherSectionMemberships.sectionId, assignment.sectionId),
          eq(teacherSectionMemberships.teacherId, user.userId),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      });
      if (!membership) throw Errors.forbidden('Access denied');
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
    const conditions: any[] = [];

    if (user.role === 'STUDENT') {
      studentId = user.userId; // Students can only view their own
    } else if (user.role === 'TEACHER') {
      const memberships = await db.query.teacherSectionMemberships.findMany({
        where: and(
          eq(teacherSectionMemberships.teacherId, user.userId),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
        columns: { sectionId: true },
      });
      const sectionIds = memberships.map((membership) => membership.sectionId);
      if (sectionIds.length === 0) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      const teacherAssignments = await db.query.assignments.findMany({
        where: inArray(assignments.sectionId, sectionIds),
        columns: { id: true },
      });
      const assignmentIds = teacherAssignments.map((item) => item.id);
      if (assignmentIds.length === 0) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      conditions.push(inArray(submissions.assignmentId, assignmentIds));
    } else if (user.role === 'ORGANIZATION_ADMIN') {
      const orgAssignments = await db.query.assignments.findMany({
        where: eq(assignments.organizationId, user.organizationId!),
        columns: { id: true },
      });
      const assignmentIds = orgAssignments.map((item) => item.id);
      if (assignmentIds.length === 0) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      conditions.push(inArray(submissions.assignmentId, assignmentIds));
    }

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

