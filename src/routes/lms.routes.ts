import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  assignments,
  classes,
  courseAllocations,
  courseAssessmentAnswers,
  courseAssessmentAssignments,
  courseAssessmentAttempts,
  courseAssessmentQuestions,
  courseAssessments,
  courseLessonProgress,
  courses,
  questionOptions,
  questions,
  sections,
  studentSectionMemberships,
  submissions,
  teacherSectionMemberships,
  users,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export function extractJoinCode(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  try {
    if (trimmed.includes('://') || trimmed.includes('?')) {
      const parsed = new URL(
        trimmed.startsWith('http') ? trimmed : `https://lplatform.local/${trimmed}`,
      );
      const param =
        parsed.searchParams.get('join') ||
        parsed.searchParams.get('code') ||
        parsed.searchParams.get('sectionId');
      if (param) return param.trim().toLowerCase();
      const tail = parsed.pathname.split('/').filter(Boolean).pop();
      if (tail) return tail.trim().toLowerCase();
    }
  } catch {
    // Fallback to raw trimmed code when input is not URL-shaped.
  }
  return trimmed.toLowerCase();
}

export function sanitizeAttemptQuestion(
  row: {
    questionId: string;
    marks: number;
    questionSnapshot: unknown;
    question: typeof questions.$inferSelect | null;
  },
  options: Array<{ id: string; optionText: string; orderNum: number }>,
) {
  const snap = (row.questionSnapshot ?? {}) as Record<string, unknown>;
  return {
    id: row.questionId,
    type: String(row.question?.questionType ?? snap.questionType ?? 'MCQ'),
    prompt: String(row.question?.description ?? snap.description ?? snap.title ?? ''),
    title: String(row.question?.title ?? snap.title ?? ''),
    options: options.map((opt) => ({ id: opt.id, text: opt.optionText, orderNum: opt.orderNum })),
    marks: row.marks,
    topic: row.question?.topic ?? String(snap.topic ?? 'General'),
    difficulty: row.question?.difficulty ?? String(snap.difficulty ?? 'EASY'),
    estimatedMinutes: row.question?.estimatedMinutes ?? null,
  };
}

export function formatReleasedResult(attempt: typeof courseAssessmentAttempts.$inferSelect) {
  const released = attempt.status === 'RELEASED';
  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    assignmentId: attempt.assignmentId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    score: released ? attempt.score : null,
    totalMarks: attempt.totalMarks,
    passed: released ? attempt.passed : null,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() || null,
    releasedAt: released ? attempt.releasedAt?.toISOString() || null : null,
    feedbackReleased: released,
  };
}

export async function lmsRoutes(app: FastifyInstance) {
  // GET /api/learning/courses - Distinguish Platform Free vs School Courses
  app.get('/api/learning/courses', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    const conditions: any[] = [inArray(courses.status, ['PUBLISHED', 'ACTIVE'])];

    if (user.role !== 'PLATFORM_ADMIN') {
      conditions.push(
        or(
          sql`${courses.organizationId} IS NULL`,
          user.organizationId ? eq(courses.organizationId, user.organizationId) : sql`FALSE`,
        ),
      );
    }

    const courseRows = await db.query.courses.findMany({
      where: and(...conditions),
      orderBy: [desc(courses.createdAt)],
    });

    let activeAllocatedCourseIds = new Set<string>();
    if (user.organizationId) {
      const allocs = await db
        .select({ courseId: courseAllocations.courseId })
        .from(courseAllocations)
        .where(
          and(
            eq(courseAllocations.organizationId, user.organizationId),
            eq(courseAllocations.status, 'ACTIVE'),
            eq(courseAllocations.accessEnabled, true),
          ),
        );
      activeAllocatedCourseIds = new Set(allocs.map((a) => a.courseId));

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
        const secIds = memberships.map((m) => m.sectionId);
        if (secIds.length > 0) {
          const secAllocs = await db
            .select({ courseId: courseAllocations.courseId })
            .from(courseAllocations)
            .where(
              and(
                inArray(courseAllocations.sectionId, secIds),
                eq(courseAllocations.status, 'ACTIVE'),
                eq(courseAllocations.accessEnabled, true),
              ),
            );
          for (const a of secAllocs) activeAllocatedCourseIds.add(a.courseId);
        }
      }
    }

    const items = courseRows.map((c) => {
      const isPlatformCourse = c.organizationId === null;
      return {
        id: c.id,
        title: c.title,
        category: c.category || 'Computer Science',
        description: c.description || '',
        language: c.language,
        difficulty: c.difficulty,
        status: c.status === 'PUBLISHED' ? 'ACTIVE' : c.status,
        version: c.version,
        isPlatformCourse,
        scopeType: isPlatformCourse ? ('PLATFORM_FREE' as const) : ('SCHOOL' as const),
        accessEnabled:
          user.role === 'PLATFORM_ADMIN' || isPlatformCourse || activeAllocatedCourseIds.has(c.id),
        hasInteractiveReader: c.id === 'crs-ai-readiness-001',
      };
    });

    return reply.send({ items });
  });

  // GET /api/learning/classes - Enrolled sections for student or assigned sections for teacher
  app.get('/api/learning/classes', { preHandler: [authenticate] }, async (request, reply) => {
    const user = request.user!;
    let sectionIds: string[] = [];

    if (user.role === 'STUDENT') {
      const rows = await db
        .select({ sectionId: studentSectionMemberships.sectionId })
        .from(studentSectionMemberships)
        .where(
          and(
            eq(studentSectionMemberships.studentId, user.userId),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        );
      sectionIds = rows.map((r) => r.sectionId);
    } else if (user.role === 'TEACHER') {
      const rows = await db
        .select({ sectionId: teacherSectionMemberships.sectionId })
        .from(teacherSectionMemberships)
        .where(
          and(
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        );
      sectionIds = rows.map((r) => r.sectionId);
    }

    if (sectionIds.length === 0) return reply.send({ items: [] });

    const secList = await db.query.sections.findMany({
      where: inArray(sections.id, sectionIds),
      with: { class: { with: { organization: true } } },
    });

    const items = await Promise.all(
      secList.map(async (sec) => {
        const [studentCountRes, teacherRows, allocRows] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(studentSectionMemberships)
            .where(
              and(
                eq(studentSectionMemberships.sectionId, sec.id),
                eq(studentSectionMemberships.status, 'ACTIVE'),
              ),
            ),
          db
            .select({
              assignedAt: teacherSectionMemberships.assignedAt,
              id: teacherSectionMemberships.id,
              teacher: users,
            })
            .from(teacherSectionMemberships)
            .innerJoin(users, eq(teacherSectionMemberships.teacherId, users.id))
            .where(
              and(
                eq(teacherSectionMemberships.sectionId, sec.id),
                eq(teacherSectionMemberships.status, 'ACTIVE'),
              ),
            )
            .orderBy(asc(teacherSectionMemberships.assignedAt), asc(teacherSectionMemberships.id)),
          db
            .select({ course: courses })
            .from(courseAllocations)
            .innerJoin(courses, eq(courseAllocations.courseId, courses.id))
            .where(
              and(
                or(
                  eq(courseAllocations.sectionId, sec.id),
                  eq(courseAllocations.classId, sec.classId),
                  sec.class?.organizationId
                    ? and(
                        eq(courseAllocations.scope, 'ORGANIZATION'),
                        eq(courseAllocations.organizationId, sec.class.organizationId),
                      )
                    : sql`FALSE`,
                ),
                eq(courseAllocations.status, 'ACTIVE'),
                eq(courseAllocations.accessEnabled, true),
              ),
            ),
        ]);

        const uniqueCourses = new Map<string, { id: string; title: string; language: string }>();
        for (const a of allocRows) {
          uniqueCourses.set(a.course.id, {
            id: a.course.id,
            title: a.course.title,
            language: a.course.language,
          });
        }

        return {
          id: sec.id,
          joinCode: sec.id.toUpperCase(),
          sectionName: sec.name,
          classId: sec.classId,
          className: sec.class?.name || 'Class',
          grade: sec.class?.grade || '',
          academicYear: sec.class?.academicYear || '',
          organizationName: sec.class?.organization?.name || '',
          maxStudents: sec.maxStudents,
          studentCount: studentCountRes[0]?.count || 0,
          teachers: teacherRows.map((row, idx) => ({
            id: row.teacher.id,
            name: `${row.teacher.firstName} ${row.teacher.lastName}`.trim(),
            email: row.teacher.email,
            teacherRole: idx === 0 ? ('PRIMARY' as const) : ('CO_TEACHER' as const),
          })),
          courses: Array.from(uniqueCourses.values()),
        };
      }),
    );

    return reply.send({ items });
  });

  // POST /api/learning/classes/join - Student joins section in their organization by code/link
  app.post<{ Body: { code?: string } }>(
    '/api/learning/classes/join',
    { preHandler: [requireRole('STUDENT')] },
    async (request, reply) => {
      const user = request.user!;
      if (!user.organizationId) throw Errors.forbidden('Student is not linked to an organization');
      const normalized = extractJoinCode(String(request.body?.code ?? ''));
      if (!normalized) throw Errors.badRequest('Enter a valid class invitation code or link');

      const sectionRows = await db.query.sections.findMany({
        where: eq(sections.status, 'ACTIVE'),
        with: { class: true },
      });
      const target = sectionRows.find(
        (sec) =>
          sec.class.organizationId === user.organizationId &&
          sec.class.status === 'ACTIVE' &&
          sec.id.toLowerCase() === normalized,
      );

      if (!target) {
        throw Errors.notFound(
          'No active class section matches that invitation code in your school',
        );
      }

      const existing = await db.query.studentSectionMemberships.findFirst({
        where: and(
          eq(studentSectionMemberships.sectionId, target.id),
          eq(studentSectionMemberships.studentId, user.userId),
        ),
      });

      if (existing && existing.status === 'ACTIVE') {
        return reply.send({
          joined: true,
          alreadyEnrolled: true,
          sectionId: target.id,
          sectionName: target.name,
          className: target.class.name,
        });
      }

      const activeCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentSectionMemberships)
        .where(
          and(
            eq(studentSectionMemberships.sectionId, target.id),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        );
      if ((activeCount[0]?.count || 0) >= target.maxStudents) {
        throw Errors.conflict('This section has reached maximum student capacity');
      }

      if (existing) {
        await db
          .update(studentSectionMemberships)
          .set({ status: 'ACTIVE', joinedAt: new Date(), leftAt: null })
          .where(eq(studentSectionMemberships.id, existing.id));
      } else {
        await db.insert(studentSectionMemberships).values({
          id: `ssm-${uuidv4().slice(0, 8)}`,
          sectionId: target.id,
          studentId: user.userId,
          status: 'ACTIVE',
        });
      }

      return reply.status(201).send({
        joined: true,
        alreadyEnrolled: false,
        sectionId: target.id,
        sectionName: target.name,
        className: target.class.name,
      });
    },
  );

  // GET /api/learning/lesson-progress - Completed lesson IDs for current student
  app.get(
    '/api/learning/lesson-progress',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const user = request.user!;
      const query = request.query as { courseId?: string };
      const courseId = query.courseId?.trim() || 'crs-ai-readiness-001';
      const rows = await db
        .select({
          lessonId: courseLessonProgress.lessonId,
          moduleId: courseLessonProgress.moduleId,
          completedAt: courseLessonProgress.completedAt,
        })
        .from(courseLessonProgress)
        .where(
          and(
            eq(courseLessonProgress.studentId, user.userId),
            eq(courseLessonProgress.courseId, courseId),
          ),
        );
      return reply.send({
        courseId,
        completedLessonIds: rows.map((r) => r.lessonId),
        items: rows.map((r) => ({
          lessonId: r.lessonId,
          moduleId: r.moduleId,
          completedAt: r.completedAt.toISOString(),
        })),
      });
    },
  );

  // GET /api/learning/attempts/:attemptId - Resume IN_PROGRESS attempt with questions & saved answers
  app.get<{ Params: { attemptId: string } }>(
    '/api/learning/attempts/:attemptId',
    { preHandler: [requireRole('STUDENT')] },
    async (request, reply) => {
      const user = request.user!;
      if (!user.organizationId) return reply.status(403).send({ message: 'Organization required' });

      const attempt = await db.query.courseAssessmentAttempts.findFirst({
        where: and(
          eq(courseAssessmentAttempts.id, request.params.attemptId),
          eq(courseAssessmentAttempts.studentId, user.userId),
          eq(courseAssessmentAttempts.organizationId, user.organizationId),
        ),
      });
      if (!attempt) return reply.status(404).send({ message: 'Attempt not found' });

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
        savedAnswers[ans.questionId] = ans.response;
      }

      return reply.send({
        attemptId: attempt.id,
        assignmentId: attempt.assignmentId,
        assessmentId: attempt.assessmentId,
        title: assessment?.title ?? 'Assessment',
        instructions: assessment?.instructions ?? '',
        durationMinutes: assessment?.durationMinutes ?? null,
        totalMarks: attempt.totalMarks,
        passingMarks: assessment?.passingMarks ?? null,
        status: attempt.status,
        questions: assessmentQuestions.map((row) =>
          sanitizeAttemptQuestion(
            {
              questionId: row.link.questionId,
              marks: row.link.marks,
              questionSnapshot: row.link.questionSnapshot,
              question: row.question ?? null,
            },
            optByQ.get(row.link.questionId) ?? [],
          ),
        ),
        savedAnswers,
      });
    },
  );

  // GET /api/learning/results - Student historical attempts & released feedback
  app.get(
    '/api/learning/results',
    { preHandler: [requireRole('STUDENT')] },
    async (request, reply) => {
      const user = request.user!;
      if (!user.organizationId) return reply.send({ items: [] });

      const attemptRows = await db
        .select({ attempt: courseAssessmentAttempts, assessment: courseAssessments })
        .from(courseAssessmentAttempts)
        .innerJoin(
          courseAssessments,
          eq(courseAssessments.id, courseAssessmentAttempts.assessmentId),
        )
        .where(
          and(
            eq(courseAssessmentAttempts.studentId, user.userId),
            eq(courseAssessmentAttempts.organizationId, user.organizationId),
          ),
        )
        .orderBy(desc(courseAssessmentAttempts.createdAt));

      const items = await Promise.all(
        attemptRows.map(async ({ attempt, assessment }) => {
          const base = formatReleasedResult(attempt);
          let breakdown: Array<{
            questionId: string;
            prompt: string;
            type: string;
            maxMarks: number;
            marksAwarded: number | null;
            feedback: string;
            status: string;
            studentResponse: unknown;
          }> = [];

          if (attempt.status === 'RELEASED') {
            const ansRows = await db
              .select({ answer: courseAssessmentAnswers, question: questions })
              .from(courseAssessmentAnswers)
              .innerJoin(questions, eq(questions.id, courseAssessmentAnswers.questionId))
              .where(eq(courseAssessmentAnswers.attemptId, attempt.id));
            breakdown = ansRows.map(({ answer, question }) => ({
              questionId: question.id,
              prompt: question.description,
              type: question.questionType,
              maxMarks: question.marks,
              marksAwarded: answer.marksAwarded,
              feedback: answer.feedback ?? '',
              status: answer.status,
              studentResponse: answer.response,
            }));
          }

          return {
            ...base,
            title: assessment.title,
            moduleId: assessment.moduleId,
            passingMarks: assessment.passingMarks,
            breakdown,
          };
        }),
      );

      return reply.send({ items });
    },
  );

  // GET /api/assessments - List course assessments for Admin & Teacher portals
  app.get(
    '/api/assessments',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const user = request.user!;
      const rows = await db
        .select({ assessment: courseAssessments, course: courses })
        .from(courseAssessments)
        .innerJoin(courses, eq(courses.id, courseAssessments.courseId))
        .where(
          user.role === 'PLATFORM_ADMIN'
            ? undefined
            : or(
                sql`${courses.organizationId} IS NULL`,
                user.organizationId ? eq(courses.organizationId, user.organizationId) : sql`FALSE`,
              ),
        )
        .orderBy(desc(courseAssessments.createdAt));

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
      }

      const items = await Promise.all(
        rows.map(async ({ assessment, course }) => {
          const [qCountRes, assignRows, attemptRows] = await Promise.all([
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(courseAssessmentQuestions)
              .where(eq(courseAssessmentQuestions.assessmentId, assessment.id)),
            db
              .select({
                assignment: courseAssessmentAssignments,
                section: sections,
                classRow: classes,
              })
              .from(courseAssessmentAssignments)
              .innerJoin(sections, eq(sections.id, courseAssessmentAssignments.sectionId))
              .innerJoin(classes, eq(classes.id, sections.classId))
              .where(
                and(
                  eq(courseAssessmentAssignments.assessmentId, assessment.id),
                  user.role !== 'PLATFORM_ADMIN' && user.organizationId
                    ? eq(courseAssessmentAssignments.organizationId, user.organizationId)
                    : undefined,
                ),
              ),
            db
              .select({ status: courseAssessmentAttempts.status })
              .from(courseAssessmentAttempts)
              .where(
                and(
                  eq(courseAssessmentAttempts.assessmentId, assessment.id),
                  user.role !== 'PLATFORM_ADMIN' && user.organizationId
                    ? eq(courseAssessmentAttempts.organizationId, user.organizationId)
                    : undefined,
                ),
              ),
          ]);

          const visibleAssigns =
            user.role === 'TEACHER'
              ? assignRows.filter((a) => teacherSectionIds.includes(a.section.id))
              : assignRows;

          return {
            id: assessment.id,
            courseId: assessment.courseId,
            courseTitle: course.title,
            moduleId: assessment.moduleId,
            title: assessment.title,
            instructions: assessment.instructions,
            status: assessment.status,
            totalMarks: assessment.totalMarks,
            passingMarks: assessment.passingMarks,
            durationMinutes: assessment.durationMinutes,
            attemptLimit: assessment.attemptLimit,
            questionCount: qCountRes[0]?.count || 0,
            assignedSections: visibleAssigns.map((a) => ({
              assignmentId: a.assignment.id,
              sectionId: a.section.id,
              sectionName: a.section.name,
              className: a.classRow.name,
              dueAt: a.assignment.dueAt?.toISOString() || null,
            })),
            attemptCount: attemptRows.length,
            pendingReviewCount: attemptRows.filter((a) => a.status === 'PENDING_REVIEW').length,
            createdAt: assessment.createdAt.toISOString(),
          };
        }),
      );

      return reply.send({ items });
    },
  );

  // GET /api/assessments/:id - Assessment detail, questions, section assignments & scoped attempts
  app.get<{ Params: { id: string } }>(
    '/api/assessments/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const user = request.user!;
      const assessment = await db.query.courseAssessments.findFirst({
        where: eq(courseAssessments.id, request.params.id),
      });
      if (!assessment) throw Errors.notFound('Assessment not found');

      const course = await db.query.courses.findFirst({
        where: eq(courses.id, assessment.courseId),
      });
      if (
        user.role !== 'PLATFORM_ADMIN' &&
        course?.organizationId &&
        course.organizationId !== user.organizationId
      ) {
        throw Errors.forbidden('Access denied to this assessment');
      }

      let teacherSectionIds: string[] | null = null;
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
      }

      const [attachedQuestions, assignRows, attemptRows] = await Promise.all([
        db
          .select({ link: courseAssessmentQuestions, question: questions })
          .from(courseAssessmentQuestions)
          .innerJoin(questions, eq(questions.id, courseAssessmentQuestions.questionId))
          .where(eq(courseAssessmentQuestions.assessmentId, assessment.id))
          .orderBy(asc(courseAssessmentQuestions.orderNum)),
        db
          .select({ assignment: courseAssessmentAssignments, section: sections, classRow: classes })
          .from(courseAssessmentAssignments)
          .innerJoin(sections, eq(sections.id, courseAssessmentAssignments.sectionId))
          .innerJoin(classes, eq(classes.id, sections.classId))
          .where(
            and(
              eq(courseAssessmentAssignments.assessmentId, assessment.id),
              user.role !== 'PLATFORM_ADMIN' && user.organizationId
                ? eq(courseAssessmentAssignments.organizationId, user.organizationId)
                : undefined,
            ),
          ),
        db
          .select({
            attempt: courseAssessmentAttempts,
            student: users,
            assignment: courseAssessmentAssignments,
          })
          .from(courseAssessmentAttempts)
          .innerJoin(users, eq(users.id, courseAssessmentAttempts.studentId))
          .innerJoin(
            courseAssessmentAssignments,
            eq(courseAssessmentAssignments.id, courseAssessmentAttempts.assignmentId),
          )
          .where(
            and(
              eq(courseAssessmentAttempts.assessmentId, assessment.id),
              user.role !== 'PLATFORM_ADMIN' && user.organizationId
                ? eq(courseAssessmentAttempts.organizationId, user.organizationId)
                : undefined,
            ),
          )
          .orderBy(desc(courseAssessmentAttempts.createdAt)),
      ]);

      const scopedAssigns = teacherSectionIds
        ? assignRows.filter((row) => teacherSectionIds!.includes(row.section.id))
        : assignRows;
      const scopedAttempts = teacherSectionIds
        ? attemptRows.filter((row) => teacherSectionIds!.includes(row.assignment.sectionId))
        : attemptRows;

      return reply.send({
        ...assessment,
        courseTitle: course?.title || 'Course',
        createdAt: assessment.createdAt.toISOString(),
        questions: attachedQuestions.map((row) => ({
          id: row.question.id,
          title: row.question.title,
          description: row.question.description,
          questionType: row.question.questionType,
          difficulty: row.question.difficulty,
          topic: row.question.topic,
          marks: row.link.marks,
        })),
        assignments: scopedAssigns.map((row) => ({
          assignmentId: row.assignment.id,
          sectionId: row.section.id,
          sectionName: row.section.name,
          className: row.classRow.name,
          dueAt: row.assignment.dueAt?.toISOString() || null,
          status: row.assignment.status,
        })),
        attempts: scopedAttempts.map(({ attempt, student }) => ({
          id: attempt.id,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          studentEmail: student.email,
          status: attempt.status,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          submittedAt: attempt.submittedAt?.toISOString() || null,
          releasedAt: attempt.releasedAt?.toISOString() || null,
        })),
      });
    },
  );

  // POST /api/assessments - Create course assessment & optionally assign to sections
  app.post(
    '/api/assessments',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const user = request.user!;
      const body = request.body as {
        courseId?: string;
        moduleId?: string;
        title?: string;
        instructions?: string;
        passingMarks?: number | null;
        durationMinutes?: number | null;
        attemptLimit?: number;
        status?: 'DRAFT' | 'PUBLISHED';
        questionIds?: string[];
        sectionIds?: string[];
        dueAt?: string | null;
      };

      if (!body.title?.trim() || !body.courseId || !body.moduleId) {
        throw Errors.badRequest('title, courseId and moduleId are required');
      }
      const qIds = Array.from(new Set(body.questionIds ?? []));
      if (qIds.length === 0) {
        throw Errors.badRequest('Select at least one question for the assessment');
      }

      const course = await db.query.courses.findFirst({ where: eq(courses.id, body.courseId) });
      if (!course) throw Errors.notFound('Course not found');

      const selectedQuestions = await db.query.questions.findMany({
        where: inArray(questions.id, qIds),
      });
      if (selectedQuestions.length !== qIds.length) {
        throw Errors.badRequest('One or more selected questions do not exist');
      }

      const totalMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 10), 0);
      const assessmentId = `asmt-${uuidv4().slice(0, 8)}`;
      const status = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

      const created = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(courseAssessments)
          .values({
            id: assessmentId,
            courseId: course.id,
            moduleId: body.moduleId!.trim(),
            version: 1,
            title: body.title!.trim(),
            instructions: body.instructions?.trim() || '',
            status,
            totalMarks,
            passingMarks: body.passingMarks ?? Math.ceil(totalMarks * 0.4),
            durationMinutes: body.durationMinutes ?? 30,
            attemptLimit: Math.max(1, body.attemptLimit ?? 1),
            createdBy: user.userId,
            publishedAt: status === 'PUBLISHED' ? new Date() : null,
          })
          .returning();

        for (let idx = 0; idx < qIds.length; idx++) {
          const q = selectedQuestions.find((item) => item.id === qIds[idx])!;
          await tx.insert(courseAssessmentQuestions).values({
            id: `caq-${uuidv4().slice(0, 8)}`,
            assessmentId: inserted.id,
            questionId: q.id,
            marks: q.marks || 10,
            orderNum: idx + 1,
            questionSnapshot: {
              title: q.title,
              description: q.description,
              questionType: q.questionType,
              topic: q.topic,
              difficulty: q.difficulty,
            },
          });
        }

        const sectionIds = Array.from(new Set(body.sectionIds ?? []));
        if (sectionIds.length > 0 && status === 'PUBLISHED') {
          for (const secId of sectionIds) {
            const sec = await tx.query.sections.findFirst({
              where: eq(sections.id, secId),
              with: { class: true },
            });
            if (!sec) throw Errors.notFound(`Section ${secId} not found`);
            if (
              user.role !== 'PLATFORM_ADMIN' &&
              sec.class.organizationId !== user.organizationId
            ) {
              throw Errors.forbidden('Section belongs to another organization');
            }
            if (user.role === 'TEACHER') {
              const tMem = await tx.query.teacherSectionMemberships.findFirst({
                where: and(
                  eq(teacherSectionMemberships.sectionId, sec.id),
                  eq(teacherSectionMemberships.teacherId, user.userId),
                  eq(teacherSectionMemberships.status, 'ACTIVE'),
                ),
              });
              if (!tMem) throw Errors.forbidden('You are not assigned to this section');
            }
            await tx.insert(courseAssessmentAssignments).values({
              id: `caa-${uuidv4().slice(0, 8)}`,
              assessmentId: inserted.id,
              organizationId: sec.class.organizationId,
              sectionId: sec.id,
              assignedBy: user.userId,
              dueAt: body.dueAt ? new Date(body.dueAt) : null,
              status: 'ACTIVE',
            });
          }
        }

        return inserted;
      });

      return reply.status(201).send(created);
    },
  );

  // PATCH /api/assessments/:id/publish
  app.patch<{ Params: { id: string } }>(
    '/api/assessments/:id/publish',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const [updated] = await db
        .update(courseAssessments)
        .set({ status: 'PUBLISHED', publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(courseAssessments.id, request.params.id))
        .returning();
      if (!updated) throw Errors.notFound('Assessment not found');
      return reply.send(updated);
    },
  );

  // POST /api/assessments/:id/assign
  app.post<{ Params: { id: string }; Body: { sectionId?: string; dueAt?: string | null } }>(
    '/api/assessments/:id/assign',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const user = request.user!;
      const sectionId = request.body?.sectionId;
      if (!sectionId) throw Errors.badRequest('sectionId is required');
      const [assessment, section] = await Promise.all([
        db.query.courseAssessments.findFirst({
          where: eq(courseAssessments.id, request.params.id),
        }),
        db.query.sections.findFirst({ where: eq(sections.id, sectionId), with: { class: true } }),
      ]);
      if (!assessment) throw Errors.notFound('Assessment not found');
      if (!section) throw Errors.notFound('Section not found');
      if (user.role !== 'PLATFORM_ADMIN' && section.class.organizationId !== user.organizationId) {
        throw Errors.forbidden('Access denied to this section');
      }
      if (user.role === 'TEACHER') {
        const mem = await db.query.teacherSectionMemberships.findFirst({
          where: and(
            eq(teacherSectionMemberships.sectionId, section.id),
            eq(teacherSectionMemberships.teacherId, user.userId),
            eq(teacherSectionMemberships.status, 'ACTIVE'),
          ),
        });
        if (!mem) throw Errors.forbidden('You are not assigned to this section');
      }

      if (assessment.status !== 'PUBLISHED') {
        await db
          .update(courseAssessments)
          .set({ status: 'PUBLISHED', publishedAt: new Date(), updatedAt: new Date() })
          .where(eq(courseAssessments.id, assessment.id));
      }

      const existing = await db.query.courseAssessmentAssignments.findFirst({
        where: and(
          eq(courseAssessmentAssignments.assessmentId, assessment.id),
          eq(courseAssessmentAssignments.sectionId, section.id),
        ),
      });
      if (existing) {
        const [updated] = await db
          .update(courseAssessmentAssignments)
          .set({
            status: 'ACTIVE',
            dueAt: request.body.dueAt ? new Date(request.body.dueAt) : existing.dueAt,
          })
          .where(eq(courseAssessmentAssignments.id, existing.id))
          .returning();
        return reply.send(updated);
      }

      const [created] = await db
        .insert(courseAssessmentAssignments)
        .values({
          id: `caa-${uuidv4().slice(0, 8)}`,
          assessmentId: assessment.id,
          organizationId: section.class.organizationId,
          sectionId: section.id,
          assignedBy: user.userId,
          dueAt: request.body.dueAt ? new Date(request.body.dueAt) : null,
          status: 'ACTIVE',
        })
        .returning();
      return reply.status(201).send(created);
    },
  );

  // GET /api/teacher/students/:studentId/profile - Scoped teacher view of a student
  app.get<{ Params: { studentId: string } }>(
    '/api/teacher/students/:studentId/profile',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const user = request.user!;
      const student = await db.query.users.findFirst({
        where: and(eq(users.id, request.params.studentId), eq(users.role, 'STUDENT')),
        with: { organization: true },
      });
      if (!student) throw Errors.notFound('Student not found');
      if (user.role !== 'PLATFORM_ADMIN' && student.organizationId !== user.organizationId) {
        throw Errors.forbidden('Access denied');
      }

      const studentSecs = await db
        .select({
          section: sections,
          classRow: classes,
          joinedAt: studentSectionMemberships.joinedAt,
        })
        .from(studentSectionMemberships)
        .innerJoin(sections, eq(sections.id, studentSectionMemberships.sectionId))
        .innerJoin(classes, eq(classes.id, sections.classId))
        .where(
          and(
            eq(studentSectionMemberships.studentId, student.id),
            eq(studentSectionMemberships.status, 'ACTIVE'),
          ),
        );

      let allowedSecIds = studentSecs.map((s) => s.section.id);
      if (user.role === 'TEACHER') {
        const tSecs = await db
          .select({ sectionId: teacherSectionMemberships.sectionId })
          .from(teacherSectionMemberships)
          .where(
            and(
              eq(teacherSectionMemberships.teacherId, user.userId),
              eq(teacherSectionMemberships.status, 'ACTIVE'),
            ),
          );
        const set = new Set(tSecs.map((t) => t.sectionId));
        allowedSecIds = allowedSecIds.filter((id) => set.has(id));
        if (allowedSecIds.length === 0) {
          throw Errors.forbidden('This student is not enrolled in any of your assigned sections');
        }
      }

      const [lessonRes, codingSubs, attempts] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(courseLessonProgress)
          .where(eq(courseLessonProgress.studentId, student.id)),
        allowedSecIds.length
          ? db
              .select({ sub: submissions, question: questions, assignment: assignments })
              .from(submissions)
              .innerJoin(questions, eq(questions.id, submissions.questionId))
              .innerJoin(assignments, eq(assignments.id, submissions.assignmentId))
              .where(
                and(
                  eq(submissions.studentId, student.id),
                  inArray(assignments.sectionId, allowedSecIds),
                ),
              )
              .orderBy(desc(submissions.submittedAt))
              .limit(20)
          : [],
        db
          .select({ attempt: courseAssessmentAttempts, assessment: courseAssessments })
          .from(courseAssessmentAttempts)
          .innerJoin(
            courseAssessments,
            eq(courseAssessments.id, courseAssessmentAttempts.assessmentId),
          )
          .where(
            and(
              eq(courseAssessmentAttempts.studentId, student.id),
              eq(courseAssessmentAttempts.organizationId, student.organizationId!),
            ),
          )
          .orderBy(desc(courseAssessmentAttempts.createdAt)),
      ]);

      return reply.send({
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim(),
          email: student.email,
          status: student.status,
          organizationName: student.organization?.name || 'Platform',
          createdAt: student.createdAt.toISOString(),
        },
        sections: studentSecs
          .filter((s) => allowedSecIds.includes(s.section.id))
          .map((s) => ({
            id: s.section.id,
            sectionName: s.section.name,
            className: s.classRow.name,
            academicYear: s.classRow.academicYear,
            joinedAt: s.joinedAt.toISOString(),
          })),
        lessonsCompleted: lessonRes[0]?.count || 0,
        submissions: codingSubs.map(({ sub, question, assignment }) => ({
          id: sub.id,
          assignmentTitle: assignment.title,
          questionTitle: question.title,
          language: sub.language,
          status: sub.status,
          score: sub.score,
          submittedAt: sub.submittedAt.toISOString(),
        })),
        assessmentAttempts: attempts.map(({ attempt, assessment }) => ({
          id: attempt.id,
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          status: attempt.status,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          submittedAt: attempt.submittedAt?.toISOString() || null,
        })),
      });
    },
  );
}
