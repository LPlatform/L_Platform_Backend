import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { eq, ilike, and, sql, desc, or, inArray } from 'drizzle-orm';
import { db } from '../db/connection.js';
import {
  assignments,
  assignmentQuestions,
  questions,
  sections,
  submissions,
  studentSectionMemberships,
  testCases,
} from '../db/schema/index.js';
import { Errors } from '../lib/errors.js';
import { authenticate, requireRole, checkTenantAccess } from '../middleware/auth.js';

export async function assignmentRoutes(app: FastifyInstance) {
  // GET /api/assignments
  app.get('/api/assignments', { preHandler: [authenticate] }, async (request, reply) => {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize || '20', 10)));
    const sectionId = query.sectionId?.trim();
    const status = query.status?.trim();
    const search = query.search?.trim();

    const user = request.user!;
    const conditions: any[] = [];

    if (user.role === 'STUDENT') {
      // Find sections student is enrolled in
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
      // Students only see PUBLISHED or CLOSED assignments
      conditions.push(or(eq(assignments.status, 'PUBLISHED'), eq(assignments.status, 'CLOSED')));
    } else if (user.role !== 'PLATFORM_ADMIN') {
      conditions.push(eq(assignments.organizationId, user.organizationId!));
    }

    if (sectionId) conditions.push(eq(assignments.sectionId, sectionId));
    if (status && status !== 'ALL') conditions.push(eq(assignments.status, status));
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

        // If user is a student, check if they have submitted
        let mySubmissionStatus = 'NOT_SUBMITTED';
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
          }
        }

        return {
          ...asg,
          sectionName: asg.section?.name || 'Unknown',
          className: asg.section?.class?.name || 'Unknown',
          questionCount: qCount[0]?.count || 0,
          submissionCount: subCount[0]?.count || 0,
          mySubmissionStatus,
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

    // Questions in this assignment
    const aqs = await db.query.assignmentQuestions.findMany({
      where: eq(assignmentQuestions.assignmentId, id),
      orderBy: [assignmentQuestions.orderNum],
    });

    const questionsList = await Promise.all(
      aqs.map(async (aq) => {
        const q = await db.query.questions.findFirst({
          where: eq(questions.id, aq.questionId),
        });

        // Test cases: if student, ONLY return sample/non-hidden test cases!
        const allTc = await db.query.testCases.findMany({
          where: eq(testCases.questionId, aq.questionId),
          orderBy: [testCases.orderNum],
        });

        const sanitizedTestCases =
          user.role === 'STUDENT'
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

        return {
          ...q,
          marks: aq.marks,
          orderNum: aq.orderNum,
          testCases: sanitizedTestCases,
        };
      }),
    );

    return reply.send({
      ...asg,
      sectionName: asg.section?.name || 'Unknown',
      className: asg.section?.class?.name || 'Unknown',
      questions: questionsList,
    });
  });

  // POST /api/assignments
  app.post(
    '/api/assignments',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const body = request.body as any;
      if (!body.title || !body.sectionId || !body.dueDate) {
        throw Errors.badRequest('Missing required fields: title, sectionId, dueDate');
      }

      let orgId = body.organizationId;
      if (request.user!.role !== 'PLATFORM_ADMIN') {
        orgId = request.user!.organizationId;
      }

      const asgId = `asg-${uuidv4().slice(0, 8)}`;
      const newAsg = {
        id: asgId,
        organizationId: orgId!,
        sectionId: body.sectionId,
        courseAllocationId: body.courseAllocationId || null,
        createdBy: request.user!.userId,
        title: body.title.trim(),
        description: body.description || null,
        instructions: body.instructions || null,
        totalMarks: body.totalMarks || 100,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        dueDate: new Date(body.dueDate),
        status: body.status || 'PUBLISHED',
      };

      await db.insert(assignments).values(newAsg);

      // Link questions if provided
      if (Array.isArray(body.questionIds)) {
        for (let i = 0; i < body.questionIds.length; i++) {
          const qId = body.questionIds[i];
          await db.insert(assignmentQuestions).values({
            id: `aq-${uuidv4().slice(0, 8)}`,
            assignmentId: asgId,
            questionId: qId,
            marks: body.marksPerQuestion || 10,
            orderNum: i + 1,
          });
        }
      }

      return reply.status(201).send(newAsg);
    },
  );

  // PATCH /api/assignments/:id
  app.patch(
    '/api/assignments/:id',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const asg = await db.query.assignments.findFirst({ where: eq(assignments.id, id) });
      if (!asg) throw Errors.notFound('Assignment not found');

      const updateData: any = { updatedAt: new Date() };
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.description !== undefined) updateData.description = body.description;
      if (body.instructions !== undefined) updateData.instructions = body.instructions;
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
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
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
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
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
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { questionId, marks, orderNum } = request.body as any;

      if (!questionId) throw Errors.badRequest('questionId is required');

      const existingCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(assignmentQuestions)
        .where(eq(assignmentQuestions.assignmentId, id));

      const aqId = `aq-${uuidv4().slice(0, 8)}`;
      await db.insert(assignmentQuestions).values({
        id: aqId,
        assignmentId: id,
        questionId,
        marks: marks || 10,
        orderNum: orderNum || (existingCount[0]?.count || 0) + 1,
      });

      return reply.status(201).send({ success: true, id: aqId });
    },
  );

  // DELETE /api/assignments/:id/questions/:questionId
  app.delete(
    '/api/assignments/:id/questions/:questionId',
    { preHandler: [requireRole('PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'TEACHER')] },
    async (request, reply) => {
      const { id, questionId } = request.params as { id: string; questionId: string };
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
