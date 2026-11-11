import { FastifyInstance } from 'fastify';
import { and, eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import {
  courseAssessmentAnswers,
  courseAssessmentAssignments,
  courseAssessmentAttempts,
  courseAssessmentQuestions,
  courseAssessments,
  courseAllocations,
  courseLessonProgress,
  questions,
  studentSectionMemberships,
  sections,
  classes,
  teacherSectionMemberships,
  courseAssessmentReviews,
} from '../db/schema/index.js';
import { authenticate } from '../middleware/auth.js';
import { aiReadinessCourse } from '../content/ai-readiness.js';

type Json = Record<string, unknown>;
const normalized = (v: unknown) =>
  String(v ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');

function grade(question: typeof questions.$inferSelect, response: unknown, max: number) {
  const key = (question.answerKey ?? {}) as Json;
  if (
    ['SHORT_ANSWER', 'LONG_ANSWER', 'CASE_STUDY', 'PRACTICAL', 'CODE'].includes(
      question.questionType,
    )
  ) {
    return { status: 'PENDING_REVIEW', marks: null as number | null };
  }
  const correct = key.correct;
  let isCorrect = false;
  if (question.questionType === 'FILL_BLANK') {
    const accepted = Array.isArray(key.accepted) ? key.accepted : [correct];
    isCorrect = accepted.some((answer) => normalized(answer) === normalized(response));
  } else if (question.questionType === 'MULTI_SELECT') {
    const expected = (Array.isArray(correct) ? correct : []).map(normalized).sort();
    const actual = (Array.isArray(response) ? response : []).map(normalized).sort();
    if (question.allowPartialCredit && expected.length) {
      const hits = actual.filter((answer) => expected.includes(answer)).length;
      const wrong = actual.filter((answer) => !expected.includes(answer)).length;
      const fraction = Math.max(0, hits - wrong) / expected.length;
      return { status: 'GRADED', marks: Math.floor(max * Math.min(1, fraction)) };
    }
    isCorrect = JSON.stringify(expected) === JSON.stringify(actual);
  } else {
    isCorrect = normalized(correct) === normalized(response);
  }
  return { status: 'GRADED', marks: isCorrect ? max : -Math.min(question.negativeMarks, max) };
}

export async function assessmentRoutes(app: FastifyInstance) {
  app.get('/api/learning/assessments', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== 'STUDENT' || !user.organizationId)
      return reply.status(403).send({ message: 'Student access required' });
    const rows = await db
      .select({ assignment: courseAssessmentAssignments, assessment: courseAssessments })
      .from(courseAssessmentAssignments)
      .innerJoin(
        courseAssessments,
        eq(courseAssessmentAssignments.assessmentId, courseAssessments.id),
      )
      .innerJoin(sections, eq(sections.id, courseAssessmentAssignments.sectionId))
      .innerJoin(classes, eq(classes.id, sections.classId))
      .innerJoin(
        courseAllocations,
        and(
          eq(courseAllocations.courseId, courseAssessments.courseId),
          eq(courseAllocations.organizationId, user.organizationId),
          eq(courseAllocations.scope, 'ORGANIZATION'),
          eq(courseAllocations.status, 'ACTIVE'),
          eq(courseAllocations.accessEnabled, true),
        ),
      )
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
      );
    return reply.send(
      rows.map(({ assignment, assessment }) => ({
        id: assignment.id,
        assessmentId: assessment.id,
        moduleId: assessment.moduleId,
        title: assessment.title,
        instructions: assessment.instructions,
        totalMarks: assessment.totalMarks,
        passingMarks: assessment.passingMarks,
        durationMinutes: assessment.durationMinutes,
        dueAt: assignment.dueAt,
      })),
    );
  });

  app.post<{ Params: { assignmentId: string } }>(
    '/api/learning/assessments/:assignmentId/attempts',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT' || !user.organizationId)
        return reply.status(403).send({ message: 'Student access required' });
      const [row] = await db
        .select({
          assignment: courseAssessmentAssignments,
          assessment: courseAssessments,
          section: sections,
          cls: classes,
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
            eq(courseAssessmentAssignments.id, request.params.assignmentId),
            eq(courseAssessmentAssignments.organizationId, user.organizationId),
            eq(courseAssessmentAssignments.status, 'ACTIVE'),
            eq(courseAssessments.status, 'PUBLISHED'),
            eq(classes.organizationId, user.organizationId),
          ),
        );
      if (!row) return reply.status(404).send({ message: 'Assessment assignment not found' });
      const allocation = await db.query.courseAllocations.findFirst({
        where: and(
          eq(courseAllocations.courseId, row.assessment.courseId),
          eq(courseAllocations.organizationId, user.organizationId),
          eq(courseAllocations.scope, 'ORGANIZATION'),
          eq(courseAllocations.status, 'ACTIVE'),
          eq(courseAllocations.accessEnabled, true),
        ),
      });
      if (!allocation) return reply.status(403).send({ message: 'Course access is not allocated' });
      const prior = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.assessmentId, row.assessment.id),
            eq(courseAssessmentAttempts.studentId, user.userId),
          ),
        );
      const active = prior.find((a) => a.status === 'IN_PROGRESS');
      if (active) return reply.send({ attemptId: active.id, status: active.status });
      if (prior.length >= row.assessment.attemptLimit)
        return reply.status(409).send({ message: 'Attempt limit reached' });
      const now = new Date();
      if (row.assignment.startAt && now < row.assignment.startAt)
        return reply.status(403).send({ message: 'Assessment is not open yet' });
      if (row.assignment.dueAt && now > row.assignment.dueAt && !row.assessment.allowLate)
        return reply.status(403).send({ message: 'Assessment due date has passed' });
      const attemptId = uuidv4();
      const number = prior.length + 1;
      await db.insert(courseAssessmentAttempts).values({
        id: attemptId,
        assessmentId: row.assessment.id,
        assignmentId: row.assignment.id,
        studentId: user.userId,
        organizationId: user.organizationId,
        assessmentVersion: row.assessment.version,
        attemptNumber: number,
        totalMarks: row.assessment.totalMarks,
      });
      const qs = await db
        .select({ q: questions, link: courseAssessmentQuestions })
        .from(courseAssessmentQuestions)
        .innerJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
        .where(eq(courseAssessmentQuestions.assessmentId, row.assessment.id));
      return reply.send({
        attemptId,
        status: 'IN_PROGRESS',
        questions: qs.map(({ q, link }) => {
          const rawOptions = (q.answerKey as Json | null)?.options;
          const options = Array.isArray(rawOptions)
            ? rawOptions.map((option) => {
                if (!option || typeof option !== 'object') return option;
                const {
                  correct: _correct,
                  isCorrect: _isCorrect,
                  ...publicOption
                } = option as Json;
                return publicOption;
              })
            : [];
          return {
            id: q.id,
            type: q.questionType,
            prompt: q.description,
            options,
            marks: link.marks,
            topic: q.topic,
            difficulty: q.difficulty,
            estimatedMinutes: q.estimatedMinutes,
          };
        }),
      });
    },
  );

  app.put<{ Params: { attemptId: string; questionId: string }; Body: { response: unknown } }>(
    '/api/learning/attempts/:attemptId/answers/:questionId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT' || !user.organizationId)
        return reply.status(403).send({ message: 'Student access required' });
      const [attempt] = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.studentId, user.userId),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
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
      const result = grade(q.question, request.body?.response, q.link.marks);
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

  app.post<{ Params: { attemptId: string } }>(
    '/api/learning/attempts/:attemptId/submit',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== 'STUDENT' || !user.organizationId)
        return reply.status(403).send({ message: 'Student access required' });
      const [attempt] = await db
        .select()
        .from(courseAssessmentAttempts)
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.studentId, user.userId),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
          ),
        );
      if (!attempt) return reply.status(404).send({ message: 'Attempt not found' });
      if (attempt.status !== 'IN_PROGRESS')
        return reply.send({
          status: attempt.status,
          score: attempt.status === 'RELEASED' ? attempt.score : null,
          totalMarks: attempt.totalMarks,
        });
      const answers = await db
        .select()
        .from(courseAssessmentAnswers)
        .where(eq(courseAssessmentAnswers.attemptId, attempt.id));
      const needsReview = answers.some((a) => a.status === 'PENDING_REVIEW');
      const earned = answers.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
      const status = needsReview ? 'PENDING_REVIEW' : 'GRADED';
      await db
        .update(courseAssessmentAttempts)
        .set({
          status,
          score: needsReview ? null : Math.max(0, earned),
          submittedAt: new Date(),
          gradedAt: needsReview ? null : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(courseAssessmentAttempts.id, attempt.id));
      return reply.send({
        status,
        score: null,
        totalMarks: attempt.totalMarks,
      });
    },
  );

  app.get('/api/learning/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== 'STUDENT' || !user.organizationId)
      return reply.status(403).send({ message: 'Student access required' });
    const [lessons] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(courseLessonProgress)
      .where(
        and(
          eq(courseLessonProgress.studentId, user.userId),
          eq(courseLessonProgress.organizationId, user.organizationId),
        ),
      );
    const attempts = await db
      .select({ status: courseAssessmentAttempts.status, score: courseAssessmentAttempts.score })
      .from(courseAssessmentAttempts)
      .where(
        and(
          eq(courseAssessmentAttempts.studentId, user.userId),
          eq(courseAssessmentAttempts.organizationId, user.organizationId),
        ),
      );
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
      if (user.role !== 'STUDENT' || !user.organizationId)
        return reply.status(403).send({ message: 'Student access required' });
      const module = aiReadinessCourse.modules.find((item) => item.id === request.body?.moduleId);
      if (
        !module ||
        !Number.isInteger(request.body?.lessonIndex) ||
        request.body.lessonIndex < 0 ||
        request.body.lessonIndex >= module.lessons.length
      )
        return reply.status(400).send({ message: 'Invalid course lesson' });
      const [allocation] = await db
        .select({ id: courseAllocations.id })
        .from(courseAllocations)
        .where(
          and(
            eq(courseAllocations.courseId, 'crs-ai-readiness-001'),
            eq(courseAllocations.organizationId, user.organizationId),
            eq(courseAllocations.scope, 'ORGANIZATION'),
            eq(courseAllocations.status, 'ACTIVE'),
            eq(courseAllocations.accessEnabled, true),
          ),
        )
        .limit(1);
      if (!allocation) return reply.status(403).send({ message: 'Course access is not allocated' });
      const lesson = module.lessons[request.body.lessonIndex];
      await db
        .insert(courseLessonProgress)
        .values({
          id: uuidv4(),
          courseId: 'crs-ai-readiness-001',
          moduleId: module.id,
          lessonId: `${module.id}:${request.body.lessonIndex}`,
          studentId: user.userId,
          organizationId: user.organizationId,
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
      if (user.role !== 'TEACHER' || !user.organizationId)
        return reply.status(403).send({ message: 'Teacher access required' });
      const rows = await db
        .select({
          attempt: courseAssessmentAttempts,
          assessment: courseAssessments,
          answer: courseAssessmentAnswers,
          question: questions,
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
        .innerJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .innerJoin(
          teacherSectionMemberships,
          and(
            eq(teacherSectionMemberships.sectionId, courseAssessmentAssignments.sectionId),
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        )
        .where(
          and(
            eq(courseAssessmentAttempts.status, 'PENDING_REVIEW'),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
          ),
        );
      return reply.send(
        rows.map(({ attempt, assessment, answer, question }) => ({
          attemptId: attempt.id,
          assessmentTitle: assessment.title,
          studentId: attempt.studentId,
          answerId: answer.id,
          questionId: question.id,
          question: question.description,
          response: answer.response,
          rubric: question.rubric,
          maxMarks: question.marks,
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
      if (user.role !== 'TEACHER' || !user.organizationId)
        return reply.status(403).send({ message: 'Teacher access required' });
      const [row] = await db
        .select({
          attempt: courseAssessmentAttempts,
          answer: courseAssessmentAnswers,
          question: questions,
        })
        .from(courseAssessmentAnswers)
        .innerJoin(
          courseAssessmentAttempts,
          eq(courseAssessmentAttempts.id, courseAssessmentAnswers.attemptId),
        )
        .innerJoin(questions, eq(questions.id, courseAssessmentAnswers.questionId))
        .innerJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .innerJoin(
          teacherSectionMemberships,
          and(
            eq(teacherSectionMemberships.sectionId, courseAssessmentAssignments.sectionId),
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        )
        .where(
          and(
            eq(courseAssessmentAnswers.id, request.params.answerId),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
            eq(courseAssessmentAttempts.status, 'PENDING_REVIEW'),
          ),
        );
      if (!row) return reply.status(404).send({ message: 'Review item not found' });
      const marks = Number(request.body?.marksAwarded);
      if (!Number.isInteger(marks) || marks < 0 || marks > row.question.marks)
        return reply
          .status(400)
          .send({ message: 'Marks must be a whole number within the question maximum' });
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
          const score = all.reduce((sum, answer) => sum + (answer.marks ?? 0), 0);
          await tx
            .update(courseAssessmentAttempts)
            .set({
              status: 'GRADED',
              score: Math.max(0, score),
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
      if (user.role !== 'TEACHER' || !user.organizationId)
        return reply.status(403).send({ message: 'Teacher access required' });
      const [row] = await db
        .select({ attempt: courseAssessmentAttempts })
        .from(courseAssessmentAttempts)
        .innerJoin(
          courseAssessmentAssignments,
          eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
        )
        .innerJoin(
          teacherSectionMemberships,
          and(
            eq(teacherSectionMemberships.sectionId, courseAssessmentAssignments.sectionId),
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        )
        .where(
          and(
            eq(courseAssessmentAttempts.id, request.params.attemptId),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
            eq(courseAssessmentAttempts.status, 'GRADED'),
          ),
        );
      if (!row) return reply.status(404).send({ message: 'Graded attempt not found' });
      await db
        .update(courseAssessmentAttempts)
        .set({ status: 'RELEASED', releasedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseAssessmentAttempts.id, row.attempt.id));
      return reply.send({ released: true });
    },
  );
}
