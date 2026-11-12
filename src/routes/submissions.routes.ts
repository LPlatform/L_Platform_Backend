import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
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
import { getOciConfig } from '../lib/env.js';
import { authorizeOciObjectOperation, buildScopedObjectKey } from '../integrations/oci.js';
import {
  authenticate,
  isPlatformDeveloperRole,
  isPlatformOwnerRole,
  requireRole,
} from '../middleware/auth.js';

const OBJECTIVE_AUTO_GRADABLE = new Set([
  'SINGLE_MCQ',
  'MULTI_SELECT',
  'TRUE_FALSE',
  'FILL_BLANK',
  'MCQ',
]);

export async function submissionRoutes(app: FastifyInstance) {
  // POST /api/submissions/attachment-upload - Authorize scoped OCI Object Storage upload key
  app.post(
    '/api/submissions/attachment-upload',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (isPlatformDeveloperRole(user.role)) {
        throw Errors.forbidden('Platform developers cannot upload student submission artifacts');
      }

      const body = request.body as {
        assignmentId?: string;
        fileName?: string;
        contentType?: string;
        sizeBytes?: number;
      };
      if (!body.assignmentId || !body.fileName) {
        throw Errors.badRequest('assignmentId and fileName are required');
      }

      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, body.assignmentId),
      });
      if (!assignment) throw Errors.notFound('Assignment not found');

      if (user.role === 'STUDENT') {
        const membership = await db.query.studentSectionMemberships.findFirst({
          where: and(
            eq(studentSectionMemberships.sectionId, assignment.sectionId),
            eq(studentSectionMemberships.studentId, user.userId),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        });
        if (!membership) throw Errors.forbidden('You are not enrolled in this assignment section');
      } else if (user.role === 'TEACHER') {
        const teaches = await db.query.teacherSectionMemberships.findFirst({
          where: and(
            eq(teacherSectionMemberships.sectionId, assignment.sectionId),
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        });
        if (!teaches) throw Errors.forbidden('You are not assigned to this assignment section');
      } else if (
        !isPlatformOwnerRole(user.role) &&
        (!user.organizationId || assignment.organizationId !== user.organizationId)
      ) {
        throw Errors.forbidden('You do not have access to this assignment');
      }

      const maxBytes = (assignment.maxFileSizeMb ?? 10) * 1024 * 1024;
      if (typeof body.sizeBytes === 'number' && body.sizeBytes > maxBytes) {
        throw Errors.badRequest(
          `File size exceeds assignment limit of ${assignment.maxFileSizeMb ?? 10} MB`,
        );
      }

      const cfg = getOciConfig();
      if (!cfg.configured) {
        return reply.status(503).send({
          code: 'OCI_NOT_CONFIGURED',
          message:
            'OCI Object Storage is not configured in this environment. Attachment metadata cannot be signed for private bucket upload.',
        });
      }

      const objectKey = buildScopedObjectKey({
        organizationId: assignment.organizationId,
        scope: 'submissions',
        ownerId: user.userId,
        fileName: body.fileName,
      });
      const signed = authorizeOciObjectOperation({
        method: 'PUT',
        objectKey,
      });
      return reply.send(signed);
    },
  );

  // GET /api/submissions/:id/attachment-download - Authorize scoped private OCI object download
  app.get(
    '/api/submissions/:id/attachment-download',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (isPlatformDeveloperRole(user.role)) {
        throw Errors.forbidden('Platform developers cannot access student submission artifacts');
      }

      const { id } = request.params as { id: string };
      const sub = await db.query.submissions.findFirst({ where: eq(submissions.id, id) });
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

      if (!sub.attachmentUrl) {
        throw Errors.notFound('No attachment linked to this submission');
      }
      const cfg = getOciConfig();
      if (!cfg.configured) {
        return reply.status(503).send({
          code: 'OCI_NOT_CONFIGURED',
          message: 'OCI Object Storage is not configured for signed downloads.',
        });
      }
      const signed = authorizeOciObjectOperation({
        method: 'GET',
        objectKey: sub.attachmentUrl,
      });
      return reply.send(signed);
    },
  );

  // POST /api/submissions - Submit programming code OR written/conceptual/case/practical/file work
  app.post('/api/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as any;
    const user = request.user!;
    if (isPlatformDeveloperRole(user.role)) {
      throw Errors.forbidden('Platform developers cannot submit student assignments');
    }

    if (!body.assignmentId || !body.questionId) {
      throw Errors.badRequest('Missing required fields: assignmentId, questionId');
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, body.assignmentId),
    });
    if (!assignment) throw Errors.notFound('Assignment not found');

    const [linkedQuestion, questionRecord] = await Promise.all([
      db.query.assignmentQuestions.findFirst({
        where: and(
          eq(assignmentQuestions.assignmentId, assignment.id),
          eq(assignmentQuestions.questionId, body.questionId),
        ),
      }),
      db.query.questions.findFirst({ where: eq(questions.id, body.questionId) }),
    ]);
    if (!linkedQuestion || !questionRecord) {
      throw Errors.badRequest('Question is not part of this assignment');
    }

    const hasCode = typeof body.code === 'string' && body.code.trim().length > 0;
    const hasText = typeof body.textResponse === 'string' && body.textResponse.trim().length > 0;
    const hasStructured =
      body.responseData !== undefined &&
      body.responseData !== null &&
      typeof body.responseData === 'object' &&
      Object.keys(body.responseData).length > 0;
    const hasAttachment =
      typeof body.attachmentUrl === 'string' || typeof body.attachmentName === 'string';

    if (!hasCode && !hasText && !hasStructured && !hasAttachment) {
      throw Errors.badRequest(
        'Provide code, textResponse, responseData, or attachment details to submit',
      );
    }

    const isCodeWork =
      hasCode &&
      (assignment.assignmentType === 'PROGRAMMING' ||
        ['PROGRAMMING', 'CODE'].includes(questionRecord.questionType));
    const language = body.language || 'PYTHON';
    if (isCodeWork && !['PYTHON', 'JAVA', 'CPP'].includes(language)) {
      throw Errors.badRequest('Unsupported language. Allowed: PYTHON, JAVA, CPP');
    }

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

      if (!assignment.allowResubmit) {
        const existingSub = await db.query.submissions.findFirst({
          where: and(
            eq(submissions.assignmentId, assignment.id),
            eq(submissions.questionId, body.questionId),
            eq(submissions.studentId, user.userId),
          ),
        });
        if (existingSub) {
          throw Errors.conflict('Resubmission is disabled for this assignment');
        }
      }
    } else if (user.role === 'TEACHER') {
      const membership = await db.query.teacherSectionMemberships.findFirst({
        where: and(
          eq(teacherSectionMemberships.sectionId, assignment.sectionId),
          eq(teacherSectionMemberships.teacherId, user.userId),
          eq(teacherSectionMemberships.status, 'ACTIVE'),
        ),
      });
      if (!membership) throw Errors.forbidden('You are not assigned to this section');
    } else if (
      user.role === 'ORGANIZATION_ADMIN' &&
      assignment.organizationId !== user.organizationId
    ) {
      throw Errors.forbidden('Access denied');
    }

    const maxBytes = (assignment.maxFileSizeMb ?? 10) * 1024 * 1024;
    if (typeof body.attachmentSizeBytes === 'number' && body.attachmentSizeBytes > maxBytes) {
      throw Errors.badRequest(
        `Attachment exceeds maximum allowed size (${assignment.maxFileSizeMb ?? 10} MB)`,
      );
    }

    const subId = `sub-${uuidv4().slice(0, 8)}`;
    const initialStatus = isCodeWork
      ? 'PENDING'
      : OBJECTIVE_AUTO_GRADABLE.has(questionRecord.questionType)
        ? 'PENDING_REVIEW'
        : 'PENDING_REVIEW';

    // Never execute untrusted student code in API or Edge processes.
    await db.insert(submissions).values({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      code: hasCode ? body.code : '',
      language,
      textResponse: hasText ? body.textResponse.trim() : null,
      responseData: hasStructured ? body.responseData : {},
      attachmentUrl: body.attachmentUrl || null,
      attachmentName: body.attachmentName || null,
      attachmentMime: body.attachmentMime || null,
      attachmentSizeBytes:
        typeof body.attachmentSizeBytes === 'number' ? body.attachmentSizeBytes : null,
      status: initialStatus,
    });

    return reply.status(202).send({
      id: subId,
      assignmentId: body.assignmentId,
      questionId: body.questionId,
      studentId: user.userId,
      language,
      status: initialStatus,
      score: null,
      totalTestCases: 0,
      passedTestCases: 0,
      results: [],
    });
  });

  // PATCH /api/submissions/:id/grade - Teacher/Admin manual grading & feedback release
  app.patch(
    '/api/submissions/:id/grade',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        score?: number;
        teacherFeedback?: string;
        releaseFeedback?: boolean;
        status?: string;
      };
      const user = request.user!;

      const sub = await db.query.submissions.findFirst({ where: eq(submissions.id, id) });
      if (!sub) throw Errors.notFound('Submission not found');

      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, sub.assignmentId),
      });
      if (!assignment) throw Errors.notFound('Assignment not found');

      if (!isPlatformOwnerRole(user.role)) {
        if (
          user.role === 'ORGANIZATION_ADMIN' &&
          assignment.organizationId !== user.organizationId
        ) {
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
          if (!membership) throw Errors.forbidden('You are not assigned to this section');
        }
      }

      const linkedQuestion = await db.query.assignmentQuestions.findFirst({
        where: and(
          eq(assignmentQuestions.assignmentId, assignment.id),
          eq(assignmentQuestions.questionId, sub.questionId),
        ),
      });
      const maxMarks = linkedQuestion?.marks ?? assignment.totalMarks ?? 100;

      if (body.score !== undefined) {
        if (
          typeof body.score !== 'number' ||
          Number.isNaN(body.score) ||
          body.score < 0 ||
          body.score > maxMarks
        ) {
          throw Errors.badRequest(`Score must be between 0 and ${maxMarks}`);
        }
      }

      const release = body.releaseFeedback !== false;
      const now = new Date();
      const [updated] = await db
        .update(submissions)
        .set({
          score: body.score !== undefined ? Math.round(body.score) : sub.score,
          teacherFeedback:
            body.teacherFeedback !== undefined ? body.teacherFeedback : sub.teacherFeedback,
          status: body.status || 'GRADED',
          gradedBy: user.userId,
          gradedAt: now,
          feedbackReleasedAt: release ? now : sub.feedbackReleasedAt,
        })
        .where(eq(submissions.id, id))
        .returning();

      return reply.send({
        ...updated,
        feedbackReleased: Boolean(updated.feedbackReleasedAt),
      });
    },
  );

  // GET /api/submissions/:id
  app.get('/api/submissions/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;
    if (isPlatformDeveloperRole(user.role)) {
      throw Errors.forbidden('Platform developers cannot view student submissions');
    }

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

    const feedbackVisible = !isStudent || Boolean(sub.feedbackReleasedAt);
    return reply.send({
      ...sub,
      feedbackReleased: Boolean(sub.feedbackReleasedAt),
      score: feedbackVisible ? sub.score : null,
      teacherFeedback: feedbackVisible ? sub.teacherFeedback : null,
      results: sanitizedResults,
    });
  });

  // GET /api/submissions
  app.get('/api/submissions', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (isPlatformDeveloperRole(user.role)) {
      throw Errors.forbidden('Platform developers cannot view student submissions');
    }

    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const assignmentId = query.assignmentId?.trim();
    const questionId = query.questionId?.trim();
    let studentId = query.studentId?.trim();

    const conditions: any[] = [];

    if (user.role === 'STUDENT') {
      studentId = user.userId;
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
      if (!user.organizationId) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      const orgAssignments = await db.query.assignments.findMany({
        where: eq(assignments.organizationId, user.organizationId),
        columns: { id: true },
      });
      const assignmentIds = orgAssignments.map((item) => item.id);
      if (assignmentIds.length === 0) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      conditions.push(inArray(submissions.assignmentId, assignmentIds));
    } else if (!isPlatformOwnerRole(user.role)) {
      throw Errors.forbidden('Access denied');
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

    const isStudent = user.role === 'STUDENT';
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

        const feedbackVisible = !isStudent || Boolean(s.feedbackReleasedAt);
        return {
          ...s,
          feedbackReleased: Boolean(s.feedbackReleasedAt),
          score: feedbackVisible ? s.score : null,
          teacherFeedback: feedbackVisible ? s.teacherFeedback : null,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
          studentEmail: student?.email || '',
          questionTitle: q?.title || 'Unknown Question',
          questionType: q?.questionType || 'PROGRAMMING',
          assignmentTitle: asg?.title || 'Unknown Assignment',
          assignmentType: asg?.assignmentType || 'PROGRAMMING',
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
