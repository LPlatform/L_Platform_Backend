import { FastifyInstance } from 'fastify';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import {
  courseAssessmentAnswers,
  courseAssessmentAssignments,
  courseAssessmentAttempts,
  courseAssessmentQuestions,
  courseAssessments,
  courseLessonProgress,
  questionOptions,
  questions,
  studentSectionMemberships,
  sections,
  classes,
  teacherSectionMemberships,
  courseAssessmentReviews,
} from '../db/schema/index.js';
import { authenticate, isPlatformDeveloperRole, isPlatformOwnerRole } from '../middleware/auth.js';
import { aiReadinessCourse } from '../content/ai-readiness.js';
import { sanitizeAttemptQuestion } from './lms.routes.js';

type Json = Record<string, unknown>;
const normalized = (v: unknown) =>
  String(v ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');

const MANUAL_REVIEW_TYPES = new Set([
  'SHORT_ANSWER',
  'LONG_CASE',
  'LONG_ANSWER',
  'CASE_STUDY',
  'PRACTICAL',
  'PROJECT',
  'FILE_SUBMISSION',
  'CODE',
  'CODING',
  'PROGRAMMING',
]);

function grade(
  question: typeof questions.$inferSelect,
  opts: Array<{ id: string; optionText: string; isCorrect: boolean }>,
  response: unknown,
  max: number,
  snapshot?: unknown,
) {
  const snap = (snapshot ?? {}) as Json;
  const snapKey =
    snap.answerKey && typeof snap.answerKey === 'object' ? (snap.answerKey as Json) : {};
  const liveKey =
    question.answerKey && typeof question.answerKey === 'object'
      ? (question.answerKey as Json)
      : {};
  const key = (Object.keys(snapKey).length > 0 ? snapKey : liveKey) as Json;
  if (MANUAL_REVIEW_TYPES.has(question.questionType)) {
    return { status: 'PENDING_REVIEW', marks: null as number | null };
  }

  const snapOpts = Array.isArray(snap.options)
    ? (snap.options as Array<{
        id?: string;
        optionText?: string;
        text?: string;
        isCorrect?: boolean;
      }>)
    : [];
  const snapHasGrading = snapOpts.some((o) => typeof o.isCorrect === 'boolean');
  const mapSnapOpts = () =>
    snapOpts.map((o, idx) => ({
      id: String(o.id ?? `opt-${idx}`),
      optionText: String(o.optionText ?? o.text ?? ''),
      isCorrect: Boolean(o.isCorrect),
    }));
  const effectiveOpts =
    snapHasGrading && snapOpts.length > 0 ? mapSnapOpts() : opts.length ? opts : mapSnapOpts();

  const optTextById = new Map(effectiveOpts.map((o) => [normalized(o.id), o.optionText]));
  const correctOpts = effectiveOpts.filter((o) => o.isCorrect);

  if (question.questionType === 'FILL_BLANK') {
    const rawAccepted = Array.isArray(key.accepted)
      ? key.accepted
      : Array.isArray(key.acceptedAnswers)
        ? key.acceptedAnswers
        : key.correct !== undefined
          ? [key.correct]
          : [];
    const actualNorm = normalized(response);
    const isCorrect =
      actualNorm.length > 0 && rawAccepted.some((answer) => normalized(answer) === actualNorm);
    return { status: 'GRADED', marks: isCorrect ? max : -Math.min(question.negativeMarks, max) };
  }

  if (question.questionType === 'MULTI_SELECT') {
    const rawSelected = Array.isArray(response)
      ? response
      : response !== undefined && response !== null
        ? [response]
        : [];
    const resolveToNormText = (val: unknown) => {
      const k = normalized(val);
      return normalized(optTextById.get(k) ?? val);
    };
    const actual = Array.from(new Set(rawSelected.map(resolveToNormText).filter(Boolean))).sort();
    const expected = correctOpts.length
      ? Array.from(new Set(correctOpts.map((o) => normalized(o.optionText)))).sort()
      : Array.from(
          new Set((Array.isArray(key.correct) ? key.correct : []).map((v) => resolveToNormText(v))),
        ).sort();

    if (question.allowPartialCredit && expected.length) {
      const hits = actual.filter((answer) => expected.includes(answer)).length;
      const wrong = actual.filter((answer) => !expected.includes(answer)).length;
      const fraction = Math.max(0, hits - wrong) / expected.length;
      return { status: 'GRADED', marks: Math.floor(max * Math.min(1, fraction)) };
    }
    const isCorrect = expected.length > 0 && JSON.stringify(expected) === JSON.stringify(actual);
    return { status: 'GRADED', marks: isCorrect ? max : -Math.min(question.negativeMarks, max) };
  }

  // SINGLE_MCQ / MCQ / TRUE_FALSE
  const rawNorm = normalized(response);
  const resolvedActual = normalized(optTextById.get(rawNorm) ?? response);
  let isCorrect = false;
  if (correctOpts.length > 0) {
    isCorrect = correctOpts.some(
      (o) => normalized(o.id) === rawNorm || normalized(o.optionText) === resolvedActual,
    );
  }
  if (!isCorrect && key.correct !== undefined) {
    isCorrect = normalized(key.correct) === rawNorm || normalized(key.correct) === resolvedActual;
  }
  if (!isCorrect && typeof key.correctOption === 'string') {
    isCorrect = normalized(key.correctOption) === resolvedActual;
  }
  if (!isCorrect && typeof key.correctOptionId === 'string') {
    isCorrect = normalized(key.correctOptionId) === rawNorm;
  }
  return { status: 'GRADED', marks: isCorrect ? max : -Math.min(question.negativeMarks, max) };
}

function unwrapResponse(raw: unknown): unknown {
  if (raw && typeof raw === 'object' && 'value' in (raw as Record<string, unknown>)) {
    return (raw as Record<string, unknown>).value;
  }
  return raw;
}

async function buildAttemptPayload(attempt: typeof courseAssessmentAttempts.$inferSelect) {
  const [assessment, assessmentQuestions, answerRows] = await Promise.all([
    db.query.courseAssessments.findFirst({
      where: eq(courseAssessments.id, attempt.assessmentId),
    }),
    db
      .select({ link: courseAssessmentQuestions, question: questions })
      .from(courseAssessmentQuestions)
      .leftJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
      .where(eq(courseAssessmentQuestions.assessmentId, attempt.assessmentId))
      .orderBy(asc(courseAssessmentQuestions.orderNum)),
    db
      .select()
      .from(courseAssessmentAnswers)
      .where(eq(courseAssessmentAnswers.attemptId, attempt.id)),
  ]);

  const qIds = assessmentQuestions.map((row) => row.link.questionId);
  const optRows = qIds.length
    ? await db
        .select()
        .from(questionOptions)
        .where(inArray(questionOptions.questionId, qIds))
        .orderBy(asc(questionOptions.orderNum))
    : [];
  const optByQ = new Map<string, Array<{ id: string; optionText: string; orderNum: number }>>();
  for (const opt of optRows) {
    const list = optByQ.get(opt.questionId) ?? [];
    list.push({ id: opt.id, optionText: opt.optionText, orderNum: opt.orderNum });
    optByQ.set(opt.questionId, list);
  }

  const savedAnswers: Record<string, unknown> = {};
  for (const ans of answerRows) {
    savedAnswers[ans.questionId] = unwrapResponse(ans.response);
  }

  return {
    attemptId: attempt.id,
    assignmentId: attempt.assignmentId,
    assessmentId: attempt.assessmentId,
    title: assessment?.title ?? 'Assessment',
    instructions: assessment?.instructions ?? '',
    durationMinutes: assessment?.durationMinutes ?? null,
    totalMarks: attempt.totalMarks,
    passingMarks: assessment?.passingMarks ?? null,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    questions: assessmentQuestions.map((row) => {
      const snapOpts = Array.isArray((row.link.questionSnapshot as Json | null)?.options)
        ? (
            (row.link.questionSnapshot as Json).options as Array<{
              id?: string;
              optionText?: string;
              text?: string;
              orderNum?: number;
            }>
          ).map((o, idx) => ({
            id: String(o.id ?? `opt-${idx + 1}`),
            optionText: String(o.optionText ?? o.text ?? ''),
            orderNum: Number(o.orderNum ?? idx + 1),
          }))
        : [];
      const dbOpts = optByQ.get(row.link.questionId) ?? [];
      return sanitizeAttemptQuestion(
        {
          questionId: row.link.questionId,
          marks: row.link.marks,
          questionSnapshot: row.link.questionSnapshot,
          question: row.question ?? null,
        },
        dbOpts.length ? dbOpts : snapOpts,
      );
    }),
    savedAnswers,
  };
}

export async function assessmentRoutes(app: FastifyInstance) {
  app.get('/api/learning/assessments', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== 'STUDENT') {
      return reply.status(403).send({ message: 'Student access required' });
    }

    const platformAssessments = await db
      .select()
      .from(courseAssessments)
      .where(
        and(eq(courseAssessments.scope, 'PLATFORM'), eq(courseAssessments.status, 'PUBLISHED')),
      );

    const assignedRows = user.organizationId
      ? await db
          .select({ assignment: courseAssessmentAssignments, assessment: courseAssessments })
          .from(courseAssessmentAssignments)
          .innerJoin(
            courseAssessments,
            eq(courseAssessmentAssignments.assessmentId, courseAssessments.id),
          )
          .innerJoin(sections, eq(sections.id, courseAssessmentAssignments.sectionId))
          .innerJoin(classes, eq(classes.id, sections.classId))
          .innerJoin(
            studentSectionMemberships,
            and(
              eq(studentSectionMemberships.sectionId, sections.id),
              eq(studentSectionMemberships.studentId, user.userId),
              eq(studentSectionMemberships.status, 'ACTIVE'),
            ),
          )
          .where(
            and(
              eq(classes.organizationId, user.organizationId),
              eq(courseAssessmentAssignments.organizationId, user.organizationId),
              eq(courseAssessmentAssignments.status, 'ACTIVE'),
              eq(courseAssessments.status, 'PUBLISHED'),
            ),
          )
      : [];

    const assignedAssessmentIds = new Set(assignedRows.map((r) => r.assessment.id));
    const list = [
      ...assignedRows.map(({ assignment, assessment }) => ({
        id: assignment.id,
        assignmentId: assignment.id,
        assessmentId: assessment.id,
        courseId: assessment.courseId,
        moduleId: assessment.moduleId,
        scope: 'SECTION' as const,
        title: assessment.title,
        instructions: assessment.instructions,
        totalMarks: assessment.totalMarks,
        passingMarks: assessment.passingMarks,
        durationMinutes: assessment.durationMinutes,
        attemptLimit: assessment.attemptLimit,
        dueAt: assignment.dueAt,
      })),
      ...platformAssessments
        .filter((assessment) => !assignedAssessmentIds.has(assessment.id))
        .map((assessment) => ({
          id: assessment.id,
          assignmentId: null,
          assessmentId: assessment.id,
          courseId: assessment.courseId,
          moduleId: assessment.moduleId,
          scope: 'PLATFORM' as const,
          title: assessment.title,
          instructions: assessment.instructions,
          totalMarks: assessment.totalMarks,
          passingMarks: assessment.passingMarks,
          durationMinutes: assessment.durationMinutes,
          attemptLimit: assessment.attemptLimit,
          dueAt: null,
        })),
    ];

    return reply.send(list);
  });

  app.post<{ Params: { assignmentId: string } }>(
    '/api/learning/assessments/:assignmentId/attempts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT') {
        return reply.status(403).send({ message: 'Student access required' });
      }

      const targetId = request.params.assignmentId;
      let assignmentRow: typeof courseAssessmentAssignments.$inferSelect | null = null;
      let assessmentRow: typeof courseAssessments.$inferSelect | null = null;

      if (user.organizationId) {
        const [row] = await db
          .select({
            assignment: courseAssessmentAssignments,
            assessment: courseAssessments,
          })
          .from(courseAssessmentAssignments)
          .innerJoin(
            courseAssessments,
            eq(courseAssessments.id, courseAssessmentAssignments.assessmentId),
          )
          .innerJoin(sections, eq(sections.id, courseAssessmentAssignments.sectionId))
          .innerJoin(classes, eq(classes.id, sections.classId))
          .innerJoin(
            studentSectionMemberships,
            and(
              eq(studentSectionMemberships.sectionId, sections.id),
              eq(studentSectionMemberships.studentId, user.userId),
              eq(studentSectionMemberships.status, 'ACTIVE'),
            ),
          )
          .where(
            and(
              eq(courseAssessmentAssignments.id, targetId),
              eq(courseAssessmentAssignments.organizationId, user.organizationId),
              eq(courseAssessmentAssignments.status, 'ACTIVE'),
              eq(courseAssessments.status, 'PUBLISHED'),
              eq(classes.organizationId, user.organizationId),
            ),
          );
        if (row) {
          assignmentRow = row.assignment;
          assessmentRow = row.assessment;
        }
      }

      if (!assessmentRow) {
        const direct = await db.query.courseAssessments.findFirst({
          where: and(
            eq(courseAssessments.id, targetId),
            eq(courseAssessments.scope, 'PLATFORM'),
            eq(courseAssessments.status, 'PUBLISHED'),
          ),
        });
        if (direct) {
          assessmentRow = direct;
        }
      }

      if (!assessmentRow) {
        return reply.status(404).send({ message: 'Assessment not found or not available' });
      }

      const allPrior = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.assessmentId, assessmentRow.id),
            eq(courseAssessmentAttempts.studentId, user.userId),
          ),
        );

      const scopedPrior = allPrior.filter((a) =>
        assignmentRow ? a.assignmentId === assignmentRow.id : a.assignmentId === null,
      );

      const active = scopedPrior.find((a) => a.status === 'IN_PROGRESS');
      if (active) {
        return reply.send(await buildAttemptPayload(active));
      }

      const completedCount = scopedPrior.filter((a) => a.status !== 'IN_PROGRESS').length;
      if (completedCount >= assessmentRow.attemptLimit) {
        return reply.status(409).send({ message: 'Attempt limit reached' });
      }

      if (assignmentRow) {
        const now = new Date();
        if (assignmentRow.startAt && now < assignmentRow.startAt) {
          return reply.status(403).send({ message: 'Assessment is not open yet' });
        }
        if (assignmentRow.dueAt && now > assignmentRow.dueAt && !assessmentRow.allowLate) {
          return reply.status(403).send({ message: 'Assessment due date has passed' });
        }
      }

      const nextAttemptNumber = allPrior.reduce((max, a) => Math.max(max, a.attemptNumber), 0) + 1;
      const attemptId = uuidv4();
      const [created] = await db
        .insert(courseAssessmentAttempts)
        .values({
          id: attemptId,
          assessmentId: assessmentRow.id,
          assignmentId: assignmentRow?.id ?? null,
          studentId: user.userId,
          organizationId: user.organizationId ?? null,
          assessmentVersion: assessmentRow.version,
          attemptNumber: nextAttemptNumber,
          totalMarks: assessmentRow.totalMarks,
        })
        .returning();

      return reply.send(await buildAttemptPayload(created));
    },
  );

  app.put<{ Params: { attemptId: string; questionId: string }; Body: { response: unknown } }>(
    '/api/learning/attempts/:attemptId/answers/:questionId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT') {
        return reply.status(403).send({ message: 'Student access required' });
      }
      const [attempt] = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.studentId, user.userId),
            eq(courseAssessmentAttempts.status, 'IN_PROGRESS'),
          ),
        );
      if (!attempt) return reply.status(404).send({ message: 'Active attempt not found' });
      const [q] = await db
        .select({ question: questions, link: courseAssessmentQuestions })
        .from(courseAssessmentQuestions)
        .innerJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
        .where(
          and(
            eq(courseAssessmentQuestions.assessmentId, attempt.assessmentId),
            eq(questions.id, request.params.questionId),
          ),
        );
      if (!q) return reply.status(404).send({ message: 'Question not in this assessment' });

      const opts = await db
        .select()
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.question.id));
      const result = grade(
        q.question,
        opts,
        request.body?.response,
        q.link.marks,
        q.link.questionSnapshot,
      );
      await db
        .insert(courseAssessmentAnswers)
        .values({
          id: uuidv4(),
          attemptId: attempt.id,
          questionId: q.question.id,
          response: { value: request.body?.response },
          status: result.status,
          marksAwarded: result.marks,
        })
        .onConflictDoUpdate({
          target: [courseAssessmentAnswers.attemptId, courseAssessmentAnswers.questionId],
          set: {
            response: { value: request.body?.response },
            status: result.status,
            marksAwarded: result.marks,
            updatedAt: new Date(),
          },
        });
      return reply.send({ saved: true, gradingStatus: result.status });
    },
  );

  app.post<{ Params: { attemptId: string }; Body?: { answers?: Record<string, unknown> } }>(
    '/api/learning/attempts/:attemptId/submit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT') {
        return reply.status(403).send({ message: 'Student access required' });
      }
      const [attempt] = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.studentId, user.userId),
          ),
        );
      if (!attempt) return reply.status(404).send({ message: 'Attempt not found' });
      if (attempt.status !== 'IN_PROGRESS') {
        return reply.send({
          attemptId: attempt.id,
          status: attempt.status,
          score: attempt.status === 'RELEASED' ? attempt.score : null,
          totalMarks: attempt.totalMarks,
        });
      }

      const incomingAnswers = request.body?.answers;
      if (incomingAnswers && typeof incomingAnswers === 'object') {
        const qs = await db
          .select({ link: courseAssessmentQuestions, question: questions })
          .from(courseAssessmentQuestions)
          .innerJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
          .where(eq(courseAssessmentQuestions.assessmentId, attempt.assessmentId));
        const qIds = qs.map((item) => item.question.id);
        const optRows = qIds.length
          ? await db.select().from(questionOptions).where(inArray(questionOptions.questionId, qIds))
          : [];
        const optMap = new Map<
          string,
          Array<{ id: string; optionText: string; isCorrect: boolean }>
        >();
        for (const o of optRows) {
          const list = optMap.get(o.questionId) ?? [];
          list.push(o);
          optMap.set(o.questionId, list);
        }
        for (const { link, question } of qs) {
          if (!(question.id in incomingAnswers)) continue;
          const val = incomingAnswers[question.id];
          const res = grade(
            question,
            optMap.get(question.id) ?? [],
            val,
            link.marks,
            link.questionSnapshot,
          );
          await db
            .insert(courseAssessmentAnswers)
            .values({
              id: uuidv4(),
              attemptId: attempt.id,
              questionId: question.id,
              response: { value: val },
              status: res.status,
              marksAwarded: res.marks,
            })
            .onConflictDoUpdate({
              target: [courseAssessmentAnswers.attemptId, courseAssessmentAnswers.questionId],
              set: {
                response: { value: val },
                status: res.status,
                marksAwarded: res.marks,
                updatedAt: new Date(),
              },
            });
        }
      }

      const [assessment, answers, assessmentQs] = await Promise.all([
        db.query.courseAssessments.findFirst({
          where: eq(courseAssessments.id, attempt.assessmentId),
        }),
        db
          .select()
          .from(courseAssessmentAnswers)
          .where(eq(courseAssessmentAnswers.attemptId, attempt.id)),
        db
          .select({ link: courseAssessmentQuestions, question: questions })
          .from(courseAssessmentQuestions)
          .innerJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
          .where(eq(courseAssessmentQuestions.assessmentId, attempt.assessmentId)),
      ]);

      const answerByQ = new Map(answers.map((a) => [a.questionId, a]));
      for (const { question } of assessmentQs) {
        if (!answerByQ.has(question.id) && MANUAL_REVIEW_TYPES.has(question.questionType)) {
          await db
            .insert(courseAssessmentAnswers)
            .values({
              id: uuidv4(),
              attemptId: attempt.id,
              questionId: question.id,
              response: { value: null },
              status: 'PENDING_REVIEW',
              marksAwarded: null,
            })
            .onConflictDoNothing();
        }
      }
      const needsReview = assessmentQs.some(({ question }) => {
        const ans = answerByQ.get(question.id);
        if (ans) return ans.status === 'PENDING_REVIEW';
        return MANUAL_REVIEW_TYPES.has(question.questionType);
      });

      const earned = Math.max(
        0,
        answers.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0),
      );
      const isSelfPacedPlatform = attempt.assignmentId === null;
      const now = new Date();
      const status = needsReview ? 'PENDING_REVIEW' : isSelfPacedPlatform ? 'RELEASED' : 'GRADED';
      const passingMarks = assessment?.passingMarks ?? Math.ceil(attempt.totalMarks * 0.4);
      const passed = status === 'RELEASED' || status === 'GRADED' ? earned >= passingMarks : null;

      await db
        .update(courseAssessmentAttempts)
        .set({
          status,
          score: needsReview ? null : earned,
          passed,
          submittedAt: now,
          gradedAt: needsReview ? null : now,
          releasedAt: status === 'RELEASED' ? now : null,
          updatedAt: now,
        })
        .where(eq(courseAssessmentAttempts.id, attempt.id));

      return reply.send({
        attemptId: attempt.id,
        status,
        score: status === 'RELEASED' ? earned : null,
        totalMarks: attempt.totalMarks,
        passed: status === 'RELEASED' ? passed : null,
      });
    },
  );

  app.get('/api/learning/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== 'STUDENT') {
      return reply.status(403).send({ message: 'Student access required' });
    }
    const [lessons] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseLessonProgress)
      .where(eq(courseLessonProgress.studentId, user.userId));
    const attempts = await db
      .select({ status: courseAssessmentAttempts.status, score: courseAssessmentAttempts.score })
      .from(courseAssessmentAttempts)
      .where(eq(courseAssessmentAttempts.studentId, user.userId));
    return reply.send({
      lessonsCompleted: lessons?.count ?? 0,
      attempts: attempts.length,
      pendingReview: attempts.filter((a) => a.status === 'PENDING_REVIEW').length,
      graded: attempts.filter((a) => a.status === 'GRADED' || a.status === 'RELEASED').length,
      earnedMarks: attempts
        .filter((a) => a.status === 'RELEASED' && a.score !== null)
        .reduce((s, a) => s + (a.score ?? 0), 0),
    });
  });

  app.post<{ Body: { moduleId: string; lessonIndex: number } }>(
    '/api/learning/progress/lessons',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT') {
        return reply.status(403).send({ message: 'Student access required' });
      }
      const module = aiReadinessCourse.modules.find((item) => item.id === request.body?.moduleId);
      if (
        !module ||
        !Number.isInteger(request.body?.lessonIndex) ||
        request.body.lessonIndex < 0 ||
        request.body.lessonIndex >= module.lessons.length
      ) {
        return reply.status(400).send({ message: 'Invalid course lesson' });
      }
      const lesson = module.lessons[request.body.lessonIndex];
      await db
        .insert(courseLessonProgress)
        .values({
          id: uuidv4(),
          courseId: 'crs-ai-readiness-001',
          moduleId: module.id,
          lessonId: `${module.id}:${request.body.lessonIndex}`,
          studentId: user.userId,
          organizationId: user.organizationId ?? null,
        })
        .onConflictDoNothing();
      return reply.send({ completed: true, moduleId: module.id, lessonTitle: lesson.title });
    },
  );

  app.get(
    '/api/teacher/assessment-reviews',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (
        isPlatformDeveloperRole(user.role) ||
        !['TEACHER', 'ORGANIZATION_ADMIN', 'PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(user.role)
      ) {
        return reply.status(403).send({ message: 'Teacher or Admin access required' });
      }

      let teacherSectionIds: string[] = [];
      if (user.role === 'TEACHER') {
        const mems = await db
          .select({ sectionId: teacherSectionMemberships.sectionId })
          .from(teacherSectionMemberships)
          .where(
            and(
              eq(teacherSectionMemberships.teacherId, user.userId),
              eq(teacherSectionMemberships.status, 'ACTIVE'),
            ),
          );
        teacherSectionIds = mems.map((m) => m.sectionId);
        if (teacherSectionIds.length === 0) return reply.send([]);
      }

      const rows = await db
        .select({
          attempt: courseAssessmentAttempts,
          assessment: courseAssessments,
          answer: courseAssessmentAnswers,
          question: questions,
          link: courseAssessmentQuestions,
          assignment: courseAssessmentAssignments,
        })
        .from(courseAssessmentAttempts)
        .innerJoin(
          courseAssessments,
          eq(courseAssessments.id, courseAssessmentAttempts.assessmentId),
        )
        .innerJoin(
          courseAssessmentAnswers,
          eq(courseAssessmentAnswers.attemptId, courseAssessmentAttempts.id),
        )
        .innerJoin(questions, eq(questions.id, courseAssessmentAnswers.questionId))
        .leftJoin(
          courseAssessmentQuestions,
          and(
            eq(courseAssessmentQuestions.assessmentId, courseAssessments.id),
            eq(courseAssessmentQuestions.questionId, questions.id),
          ),
        )
        .leftJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .where(
          and(
            eq(courseAssessmentAttempts.status, 'PENDING_REVIEW'),
            eq(courseAssessmentAnswers.status, 'PENDING_REVIEW'),
            !isPlatformOwnerRole(user.role) && user.organizationId
              ? eq(courseAssessmentAttempts.organizationId, user.organizationId)
              : undefined,
          ),
        );

      let filtered = rows;
      if (user.role === 'TEACHER') {
        const stuRows = await db
          .select({ studentId: studentSectionMemberships.studentId })
          .from(studentSectionMemberships)
          .where(
            and(
              inArray(studentSectionMemberships.sectionId, teacherSectionIds),
              eq(studentSectionMemberships.status, 'ACTIVE'),
            ),
          );
        const allowedStudents = new Set(stuRows.map((s) => s.studentId));
        filtered = rows.filter((r) =>
          r.attempt.assignmentId
            ? Boolean(r.assignment && teacherSectionIds.includes(r.assignment.sectionId))
            : allowedStudents.has(r.attempt.studentId),
        );
      }

      return reply.send(
        filtered.map(({ attempt, assessment, answer, question, link }) => ({
          attemptId: attempt.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          studentId: attempt.studentId,
          answerId: answer.id,
          questionId: question.id,
          question: question.description,
          response: unwrapResponse(answer.response),
          rubric: question.rubric,
          maxMarks: link?.marks ?? question.marks,
        })),
      );
    },
  );

  app.post<{
    Params: { answerId: string };
    Body: { marksAwarded: number; feedback?: string; criterionMarks?: unknown[] };
  }>(
    '/api/teacher/assessment-answers/:answerId/review',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (
        isPlatformDeveloperRole(user.role) ||
        !['TEACHER', 'ORGANIZATION_ADMIN', 'PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(user.role)
      ) {
        return reply.status(403).send({ message: 'Teacher or Admin access required' });
      }

      const [row] = await db
        .select({
          attempt: courseAssessmentAttempts,
          assessment: courseAssessments,
          answer: courseAssessmentAnswers,
          question: questions,
          link: courseAssessmentQuestions,
          assignment: courseAssessmentAssignments,
        })
        .from(courseAssessmentAnswers)
        .innerJoin(
          courseAssessmentAttempts,
          eq(courseAssessmentAttempts.id, courseAssessmentAnswers.attemptId),
        )
        .innerJoin(
          courseAssessments,
          eq(courseAssessments.id, courseAssessmentAttempts.assessmentId),
        )
        .innerJoin(questions, eq(questions.id, courseAssessmentAnswers.questionId))
        .leftJoin(
          courseAssessmentQuestions,
          and(
            eq(courseAssessmentQuestions.assessmentId, courseAssessments.id),
            eq(courseAssessmentQuestions.questionId, questions.id),
          ),
        )
        .leftJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .where(
          and(
            eq(courseAssessmentAnswers.id, request.params.answerId),
            eq(courseAssessmentAttempts.status, 'PENDING_REVIEW'),
            !isPlatformOwnerRole(user.role) && user.organizationId
              ? eq(courseAssessmentAttempts.organizationId, user.organizationId)
              : undefined,
          ),
        );
      if (!row) return reply.status(404).send({ message: 'Review item not found' });

      if (user.role === 'TEACHER') {
        const mems = await db
          .select({ sectionId: teacherSectionMemberships.sectionId })
          .from(teacherSectionMemberships)
          .where(
            and(
              eq(teacherSectionMemberships.teacherId, user.userId),
              eq(teacherSectionMemberships.status, 'ACTIVE'),
            ),
          );
        const teacherSecIds = mems.map((m) => m.sectionId);
        const allowed = row.attempt.assignmentId
          ? Boolean(row.assignment && teacherSecIds.includes(row.assignment.sectionId))
          : teacherSecIds.length
            ? Boolean(
                await db.query.studentSectionMemberships.findFirst({
                  where: and(
                    inArray(studentSectionMemberships.sectionId, teacherSecIds),
                    eq(studentSectionMemberships.studentId, row.attempt.studentId),
                    eq(studentSectionMemberships.status, 'ACTIVE'),
                  ),
                }),
              )
            : false;
        if (!allowed) {
          return reply
            .status(403)
            .send({ message: 'Access denied to review this student attempt' });
        }
      }

      const maxMarks = row.link?.marks ?? row.question.marks;
      const marks = Number(request.body?.marksAwarded);
      if (!Number.isInteger(marks) || marks < 0 || marks > maxMarks) {
        return reply
          .status(400)
          .send({ message: 'Marks must be a whole number within the question maximum' });
      }
      await db.transaction(async (tx) => {
        await tx
          .update(courseAssessmentAnswers)
          .set({
            status: 'GRADED',
            marksAwarded: marks,
            feedback: request.body.feedback ?? '',
            updatedAt: new Date(),
          })
          .where(eq(courseAssessmentAnswers.id, row.answer.id));
        await tx.insert(courseAssessmentReviews).values({
          id: uuidv4(),
          attemptId: row.attempt.id,
          answerId: row.answer.id,
          reviewerId: user.userId,
          marksAwarded: marks,
          criterionMarks: request.body.criterionMarks ?? [],
          feedback: request.body.feedback ?? '',
        });
        const pending = await tx
          .select({ id: courseAssessmentAnswers.id })
          .from(courseAssessmentAnswers)
          .where(
            and(
              eq(courseAssessmentAnswers.attemptId, row.attempt.id),
              eq(courseAssessmentAnswers.status, 'PENDING_REVIEW'),
            ),
          );
        if (pending.length === 0) {
          const all = await tx
            .select({ marks: courseAssessmentAnswers.marksAwarded })
            .from(courseAssessmentAnswers)
            .where(eq(courseAssessmentAnswers.attemptId, row.attempt.id));
          const score = Math.max(
            0,
            all.reduce((sum, answer) => sum + (answer.marks ?? 0), 0),
          );
          const passing = row.assessment.passingMarks ?? Math.ceil(row.attempt.totalMarks * 0.4);
          await tx
            .update(courseAssessmentAttempts)
            .set({
              status: 'GRADED',
              score,
              passed: score >= passing,
              gradedAt: new Date(),
              graderId: user.userId,
              updatedAt: new Date(),
            })
            .where(eq(courseAssessmentAttempts.id, row.attempt.id));
        }
      });
      return reply.send({ reviewed: true });
    },
  );

  app.post<{ Params: { attemptId: string } }>(
    '/api/teacher/assessment-attempts/:attemptId/release',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (
        isPlatformDeveloperRole(user.role) ||
        !['TEACHER', 'ORGANIZATION_ADMIN', 'PLATFORM_OWNER', 'PLATFORM_ADMIN'].includes(user.role)
      ) {
        return reply.status(403).send({ message: 'Teacher or Admin access required' });
      }

      const [row] = await db
        .select({
          attempt: courseAssessmentAttempts,
          assignment: courseAssessmentAssignments,
        })
        .from(courseAssessmentAttempts)
        .leftJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.status, 'GRADED'),
            !isPlatformOwnerRole(user.role) && user.organizationId
              ? eq(courseAssessmentAttempts.organizationId, user.organizationId)
              : undefined,
          ),
        );
      if (!row) return reply.status(404).send({ message: 'Graded attempt not found' });

      if (user.role === 'TEACHER') {
        const mems = await db
          .select({ sectionId: teacherSectionMemberships.sectionId })
          .from(teacherSectionMemberships)
          .where(
            and(
              eq(teacherSectionMemberships.teacherId, user.userId),
              eq(teacherSectionMemberships.status, 'ACTIVE'),
            ),
          );
        const teacherSecIds = mems.map((m) => m.sectionId);
        const allowed = row.attempt.assignmentId
          ? Boolean(row.assignment && teacherSecIds.includes(row.assignment.sectionId))
          : teacherSecIds.length
            ? Boolean(
                await db.query.studentSectionMemberships.findFirst({
                  where: and(
                    inArray(studentSectionMemberships.sectionId, teacherSecIds),
                    eq(studentSectionMemberships.studentId, row.attempt.studentId),
                    eq(studentSectionMemberships.status, 'ACTIVE'),
                  ),
                }),
              )
            : false;
        if (!allowed) {
          return reply.status(403).send({ message: 'Access denied to release this attempt' });
        }
      }

      await db
        .update(courseAssessmentAttempts)
        .set({ status: 'RELEASED', releasedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseAssessmentAttempts.id, row.attempt.id));
      return reply.send({ released: true });
    },
  );
}
