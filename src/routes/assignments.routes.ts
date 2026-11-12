import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, asc, or, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  assignments,
  assignmentQuestions,
  questionOptions,
  questions,
  sections,
  submissions,
  studentSectionMemberships,
  teacherSectionMemberships,
  testCases,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import {
  authenticate,
  isPlatformDeveloperRole,
  isPlatformOwnerRole,
  requireRole,
} from '../middleware/auth.js';

const VALID_ASSIGNMENT_TYPES = new Set([
  'PROGRAMMING',
  'CONCEPTUAL',
  'SHORT_ANSWER',
  'CASE_STUDY',
  'PRACTICAL',
  'PROJECT',
  'FILE_SUBMISSION',
]);

export async function assignmentRoutes(app: FastifyInstance) {
  // GET /api/assignments
  app.get('/api/assignments', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (isPlatformDeveloperRole(user.role)) {
      throw Errors.forbidden('Platform developers cannot access organization student assignments');
    }

    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const sectionId = query.sectionId?.trim();
    const status = query.status?.trim();
    const search = query.search?.trim();

    const conditions: any[] = [];

    if (user.role === 'STUDENT') {
      const memberships = await db
        .select({ sectionId: studentSectionMemberships.sectionId })
        .from(studentSectionMemberships)
        .where(
          and(
            eq(studentSectionMemberships.studentId, user.userId),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        );
      const studentSecIds = memberships.map((m) => m.sectionId);

      if (studentSecIds.length === 0) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }

      conditions.push(inArray(assignments.sectionId, studentSecIds));
      conditions.push(or(eq(assignments.status, 'PUBLISHED'), eq(assignments.status, 'CLOSED')));
    } else if (!isPlatformOwnerRole(user.role)) {
      if (!user.organizationId) {
        return reply.send({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      conditions.push(eq(assignments.organizationId, user.organizationId));
      if (user.role === 'TEACHER') {
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
        conditions.push(inArray(assignments.sectionId, sectionIds));
      }
    } else if (query.organizationId && query.organizationId !== 'ALL') {
      conditions.push(eq(assignments.organizationId, query.organizationId));
    }

    if (sectionId) conditions.push(eq(assignments.sectionId, sectionId));
    if (status && status !== 'ALL') conditions.push(eq(assignments.status, status));
    if (query.assignmentType && query.assignmentType !== 'ALL') {
      conditions.push(eq(assignments.assignmentType, query.assignmentType));
    }
    if (search) conditions.push(ilike(assignments.title, `%${search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db.query.assignments.findMany({
      where: whereClause,
      with: {
        section: { with: { class: true } },
      },
      limit: pageSize,
      offset: (page - 1) * pageSize,
      orderBy: desc(assignments.createdAt),
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assignments)
      .where(whereClause);
    const total = totalResult[0]?.count || 0;

    const items = await Promise.all(
      list.map(async (asg) => {
        const qCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(assignmentQuestions)
          .where(eq(assignmentQuestions.assignmentId, asg.id));

        const subCount = await db
          .select({ count: sql<number>`count(distinct student_id)::int` })
          .from(submissions)
          .where(eq(submissions.assignmentId, asg.id));

        let mySubmissionStatus = 'NOT_SUBMITTED';
        let mySubmissionScore: number | null = null;
        let myFeedbackReleased = false;
        if (user.role === 'STUDENT') {
          const mySub = await db.query.submissions.findFirst({
            where: and(
              eq(submissions.assignmentId, asg.id),
              eq(submissions.studentId, user.userId),
            ),
            orderBy: desc(submissions.submittedAt),
          });
          if (mySub) {
            mySubmissionStatus = mySub.status;
            myFeedbackReleased = Boolean(mySub.feedbackReleasedAt);
            mySubmissionScore = myFeedbackReleased ? mySub.score : null;
          }
        }

        return {
          ...asg,
          sectionName: asg.section?.name || 'Unknown',
          className: asg.section?.class?.name || 'Unknown',
          questionCount: qCount[0]?.count || 0,
          submissionCount: subCount[0]?.count || 0,
          mySubmissionStatus,
          mySubmissionScore,
          myFeedbackReleased,
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

  // GET /api/assignments/:id
  app.get('/api/assignments/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    const asg = await db.query.assignments.findFirst({
      where: eq(assignments.id, id),
      with: {
        section: { with: { class: true } },
      },
    });

    if (!asg) throw Errors.notFound('Assignment not found');
    await assertAssignmentAccess(user, asg);

    const aqs = await db.query.assignmentQuestions.findMany({
      where: eq(assignmentQuestions.assignmentId, id),
      orderBy: [assignmentQuestions.orderNum],
    });

    const isStudent = user.role === 'STUDENT';
    const qIds = aqs.map((aq) => aq.questionId);
    const optRows = qIds.length
      ? await db
          .select()
          .from(questionOptions)
          .where(inArray(questionOptions.questionId, qIds))
          .orderBy(asc(questionOptions.orderNum))
      : [];
    const optByQ = new Map<string, Array<typeof questionOptions.$inferSelect>>();
    for (const opt of optRows) {
      const arr = optByQ.get(opt.questionId) ?? [];
      arr.push(opt);
      optByQ.set(opt.questionId, arr);
    }

    const questionsList = await Promise.all(
      aqs.map(async (aq) => {
        const q = await db.query.questions.findFirst({
          where: eq(questions.id, aq.questionId),
        });

        const allTc = await db.query.testCases.findMany({
          where: eq(testCases.questionId, aq.questionId),
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

        const opts = (optByQ.get(aq.questionId) ?? []).map((opt) =>
          isStudent
            ? { id: opt.id, optionText: opt.optionText, orderNum: opt.orderNum }
            : {
                id: opt.id,
                optionText: opt.optionText,
                orderNum: opt.orderNum,
                isCorrect: opt.isCorrect,
              },
        );

        if (isStudent && q) {
          return {
            id: q.id,
            title: q.title,
            description: q.description,
            inputFormat: q.inputFormat,
            outputFormat: q.outputFormat,
            constraints: q.constraints,
            examples: q.examples,
            difficulty: q.difficulty,
            topic: q.topic,
            supportedLanguages: q.supportedLanguages,
            questionType: q.questionType,
            courseModuleId: q.courseModuleId,
            sourcePage: q.sourcePage,
            sourceReference: q.sourceReference,
            estimatedMinutes: q.estimatedMinutes,
            marks: aq.marks,
            orderNum: aq.orderNum,
            options: opts,
            testCases: sanitizedTestCases,
          };
        }

        return {
          ...q,
          marks: aq.marks,
          orderNum: aq.orderNum,
          options: opts,
          testCases: sanitizedTestCases,
        };
      }),
    );

    let mySubmissions: unknown[] = [];
    if (isStudent) {
      const subs = await db.query.submissions.findMany({
        where: and(eq(submissions.assignmentId, id), eq(submissions.studentId, user.userId)),
        orderBy: desc(submissions.submittedAt),
      });
      mySubmissions = subs.map((s) => ({
        id: s.id,
        questionId: s.questionId,
        language: s.language,
        code: s.code,
        textResponse: s.textResponse,
        responseData: s.responseData,
        attachmentName: s.attachmentName,
        attachmentMime: s.attachmentMime,
        attachmentSizeBytes: s.attachmentSizeBytes,
        status: s.status,
        score: s.feedbackReleasedAt ? s.score : null,
        teacherFeedback: s.feedbackReleasedAt ? s.teacherFeedback : null,
        feedbackReleasedAt: s.feedbackReleasedAt?.toISOString() ?? null,
        submittedAt: s.submittedAt.toISOString(),
      }));
    }

    return reply.send({
      ...asg,
      sectionName: asg.section?.name || 'Unknown',
      className: asg.section?.class?.name || 'Unknown',
      questions: questionsList,
      mySubmissions,
    });
  });

  // POST /api/assignments
  app.post(
    '/api/assignments',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.title || !body.sectionId || !body.dueDate) {
        throw Errors.badRequest('Missing required fields: title, sectionId, dueDate');
      }

      const assignmentType = String(body.assignmentType || 'PROGRAMMING').toUpperCase();
      if (!VALID_ASSIGNMENT_TYPES.has(assignmentType)) {
        throw Errors.badRequest(`Unsupported assignmentType '${assignmentType}'`);
      }

      const section = await db.query.sections.findFirst({
        where: eq(sections.id, body.sectionId),
        with: { class: true },
      });
      if (!section) throw Errors.notFound('Section not found');

      let orgId = body.organizationId;
      if (!isPlatformOwnerRole(request.user!.role)) {
        orgId = request.user!.organizationId;
      } else if (!orgId) {
        orgId = section.class.organizationId;
      }

      if (request.user!.role === 'TEACHER') {
        const membership = await db.query.teacherSectionMemberships.findFirst({
          where: and(
            eq(teacherSectionMemberships.sectionId, section.id),
            eq(teacherSectionMemberships.teacherId, request.user!.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        });
        if (!membership) throw Errors.forbidden('You are not assigned to this section');
      } else if (
        request.user!.role === 'ORGANIZATION_ADMIN' &&
        section.class.organizationId !== orgId
      ) {
        throw Errors.forbidden('Access denied to this section');
      }

      const structuredQuestions: Array<{ questionId: string; marks?: number; orderNum?: number }> =
        Array.isArray(body.questions)
          ? body.questions
          : Array.isArray(body.questionIds)
            ? body.questionIds.map((qId: string, idx: number) => ({
                questionId: qId,
                marks: body.marksPerQuestion || 10,
                orderNum: idx + 1,
              }))
            : [];

      const qIds = Array.from(new Set(structuredQuestions.map((item) => item.questionId)));
      const qLookup = new Map<string, typeof questions.$inferSelect>();
      if (qIds.length > 0) {
        const linkedQuestions = await db.query.questions.findMany({
          where: inArray(questions.id, qIds),
        });
        if (linkedQuestions.length !== qIds.length) {
          throw Errors.badRequest('One or more questions do not exist');
        }
        if (
          !isPlatformOwnerRole(request.user!.role) &&
          linkedQuestions.some(
            (question) => question.organizationId && question.organizationId !== orgId,
          )
        ) {
          throw Errors.forbidden('A question belongs to a different organization');
        }
        for (const q of linkedQuestions) qLookup.set(q.id, q);
      }

      const computedTotal = structuredQuestions.reduce(
        (sum, item) => sum + (item.marks ?? qLookup.get(item.questionId)?.marks ?? 10),
        0,
      );

      const asgId = `asg-${uuidv4().slice(0, 8)}`;
      const newAsg = {
        id: asgId,
        organizationId: section.class.organizationId,
        sectionId: body.sectionId,
        courseAllocationId: body.courseAllocationId || null,
        createdBy: request.user!.userId,
        title: body.title.trim(),
        description: body.description || null,
        instructions: body.instructions || null,
        assignmentType,
        attachmentInstructions: body.attachmentInstructions || null,
        maxFileSizeMb: body.maxFileSizeMb ?? 10,
        allowResubmit: Boolean(body.allowResubmit),
        totalMarks: body.totalMarks ?? (computedTotal || 100),
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        dueDate: new Date(body.dueDate),
        status: body.status || 'PUBLISHED',
      };

      await db.insert(assignments).values(newAsg);

      for (let i = 0; i < structuredQuestions.length; i++) {
        const item = structuredQuestions[i];
        const q = qLookup.get(item.questionId);
        await db.insert(assignmentQuestions).values({
          id: `aq-${uuidv4().slice(0, 8)}`,
          assignmentId: asgId,
          questionId: item.questionId,
          marks: item.marks ?? q?.marks ?? 10,
          orderNum: item.orderNum ?? i + 1,
        });
      }

      return reply.status(201).send(newAsg);
    },
  );

  // PATCH /api/assignments/:id
  app.patch(
    '/api/assignments/:id',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const asg = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      if (!asg) throw Errors.notFound('Assignment not found');
      await assertAssignmentAccess(request.user!, asg);

      const updateData: any = { updatedAt: new Date() };
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.instructions !== undefined) updateData.instructions = body.instructions;
      if (body.assignmentType !== undefined) {
        const t = String(body.assignmentType).toUpperCase();
        if (!VALID_ASSIGNMENT_TYPES.has(t))
          throw Errors.badRequest(`Unsupported assignmentType '${t}'`);
        updateData.assignmentType = t;
      }
      if (body.attachmentInstructions !== undefined)
        updateData.attachmentInstructions = body.attachmentInstructions;
      if (body.maxFileSizeMb !== undefined) updateData.maxFileSizeMb = body.maxFileSizeMb;
      if (body.allowResubmit !== undefined) updateData.allowResubmit = Boolean(body.allowResubmit);
      if (body.totalMarks !== undefined) updateData.totalMarks = body.totalMarks;
      if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
      if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
      if (body.status !== undefined) updateData.status = body.status;

      await db.update(assignments).set(updateData).where(eq(assignments.id, id));
      const updated = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      return reply.send(updated);
    },
  );

  // PATCH /api/assignments/:id/publish
  app.patch(
    '/api/assignments/:id/publish',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const asg = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      if (!asg) throw Errors.notFound('Assignment not found');
      await assertAssignmentAccess(request.user!, asg);

      await db
        .update(assignments)
        .set({ status: 'PUBLISHED', updatedAt: new Date() })
        .where(eq(assignments.id, id));
      return reply.send({ success: true, status: 'PUBLISHED' });
    },
  );

  // PATCH /api/assignments/:id/close
  app.patch(
    '/api/assignments/:id/close',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const asg = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      if (!asg) throw Errors.notFound('Assignment not found');
      await assertAssignmentAccess(request.user!, asg);

      await db
        .update(assignments)
        .set({ status: 'CLOSED', updatedAt: new Date() })
        .where(eq(assignments.id, id));
      return reply.send({ success: true, status: 'CLOSED' });
    },
  );

  // POST /api/assignments/:id/questions
  app.post(
    '/api/assignments/:id/questions',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { questionId, marks, orderNum } = request.body as any;

      if (!questionId) throw Errors.badRequest('questionId is required');

      const [asg, q] = await Promise.all([
        db.query.assignments.findFirst({ where: eq(assignments.id, id) }),
        db.query.questions.findFirst({ where: eq(questions.id, questionId) }),
      ]);
      if (!asg) throw Errors.notFound('Assignment not found');
      await assertAssignmentAccess(request.user!, asg);
      if (!q) throw Errors.notFound('Question not found');
      if (q.organizationId && q.organizationId !== asg.organizationId) {
        throw Errors.forbidden('Question belongs to a different organization');
      }

      const existingCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(assignmentQuestions)
        .where(eq(assignmentQuestions.assignmentId, id));

      const aqId = `aq-${uuidv4().slice(0, 8)}`;
      await db.insert(assignmentQuestions).values({
        id: aqId,
        assignmentId: id,
        questionId,
        marks: marks || q.marks || 10,
        orderNum: orderNum || (existingCount[0]?.count || 0) + 1,
      });

      return reply.status(201).send({ success: true, id: aqId });
    },
  );

  // DELETE /api/assignments/:id/questions/:questionId
  app.delete(
    '/api/assignments/:id/questions/:questionId',
    {
      preHandler: [
        requireRole('PLATFORM_OWNER', 'PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER'),
      ],
    },
    async (request, reply) => {
      const { id, questionId } = request.params as { id: string; questionId: string };
      const asg = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      if (!asg) throw Errors.notFound('Assignment not found');
      await assertAssignmentAccess(request.user!, asg);

      await db
        .delete(assignmentQuestions)
        .where(
          and(
            eq(assignmentQuestions.assignmentId, id),
            eq(assignmentQuestions.questionId, questionId),
          ),
        );
      return reply.send({ success: true });
    },
  );
}

async function assertAssignmentAccess(
  user: { userId: string; role: any; organizationId: string | null },
  assignment: { id: string; sectionId: string; organizationId: string; status: string },
) {
  if (isPlatformOwnerRole(user.role)) return;
  if (isPlatformDeveloperRole(user.role)) {
    throw Errors.forbidden('Platform developers cannot access student/organization assignments');
  }
  if (user.role === 'ORGANIZATION_ADMIN') {
    if (user.organizationId === assignment.organizationId) return;
    throw Errors.forbidden('Access denied');
  }
  const membership =
    user.role === 'STUDENT'
      ? await db.query.studentSectionMemberships.findFirst({
          where: and(
            eq(studentSectionMemberships.sectionId, assignment.sectionId),
            eq(studentSectionMemberships.studentId, user.userId),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        })
      : user.role === 'TEACHER'
        ? await db.query.teacherSectionMemberships.findFirst({
            where: and(
              eq(teacherSectionMemberships.sectionId, assignment.sectionId),
              eq(teacherSectionMemberships.teacherId, user.userId),
              eq(teacherSectionMemberships.status, 'ACTIVE'),
            ),
          })
        : null;
  if (!membership) throw Errors.forbidden('Access denied to this assignment');
  if (user.role === 'STUDENT' && !['PUBLISHED', 'CLOSED'].includes(assignment.status)) {
    throw Errors.forbidden('This assignment is not available');
  }
}
