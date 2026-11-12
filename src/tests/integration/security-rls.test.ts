import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../index.js';
import { hashPassword } from '../../lib/auth.js';
import {
  getAllowedCorsOrigins,
  getCookieSecret,
  getDatabaseUrl,
  getJwtSecret,
  isDemoResetAllowed,
} from '../../lib/env.js';
import { pool } from '../../db/connection.js';
import { applySessionRlsVars, runWithRlsContext } from '../../db/rls-context.js';

interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string | null;
  };
}

async function loginAs(email: string, password: string): Promise<AuthSession> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  expect(res.statusCode, `Login failed for ${email}: ${res.payload}`).toBe(200);
  const body = JSON.parse(res.payload) as AuthSession;
  expect(body.accessToken).toBeTruthy();
  return body;
}

describe('Security, 5-Role RBAC, PostgreSQL RLS, Tenant Isolation & Workflows E2E', () => {
  const runTag = crypto.randomBytes(4).toString('hex');
  const orgBId = `sec-test-org-b-${runTag}`;
  const orgBAdminId = `sec-test-orgb-admin-${runTag}`;
  const orgBStudentId = `sec-test-orgb-stu-${runTag}`;
  const orgBClassId = `sec-test-orgb-cls-${runTag}`;
  const orgBSectionId = `sec-test-orgb-sec-${runTag}`;
  const orgBQuestionId = `sec-test-orgb-q-${runTag}`;
  const createdUserIds: string[] = [orgBAdminId, orgBStudentId];
  const createdQuestionIds: string[] = [orgBQuestionId];
  const createdAssignmentIds: string[] = [];
  const createdAssessmentIds: string[] = [];
  const createdAttemptIds: string[] = [];
  const createdSubmissionIds: string[] = [];
  const createdSectionIds: string[] = [];
  const createdCaaIds: string[] = [];

  let owner: AuthSession;
  let developer: AuthSession;
  let orgAdminA: AuthSession;
  let teacherA: AuthSession;
  let student1A: AuthSession;
  let student2A: AuthSession;
  let independentLearner: AuthSession;
  let orgBAdmin: AuthSession;
  let orgBStudent: AuthSession;

  beforeAll(async () => {
    await app.ready();

    // Provision second isolated tenant (Org Beta) directly under SUPERUSER context
    const pwHash = await hashPassword('TenantTest@123');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO organizations (id, name, slug, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [orgBId, `Org Beta ${runTag}`, `org-beta-${runTag}`],
      );
      await client.query(
        `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
         VALUES
           ($1, $2, 'Beta', 'Admin', $3, 'ORGANIZATION_ADMIN', 'ACTIVE'),
           ($4, $2, 'Beta', 'Student', $5, 'STUDENT', 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [
          orgBAdminId,
          orgBId,
          `beta.admin.${runTag}@orgb.test`,
          orgBStudentId,
          `beta.student.${runTag}@orgb.test`,
        ],
      );
      await client.query(
        `INSERT INTO credentials (user_id, password_hash)
         VALUES ($1, $3), ($2, $3)
         ON CONFLICT (user_id) DO NOTHING`,
        [orgBAdminId, orgBStudentId, pwHash],
      );
      await client.query(
        `INSERT INTO classes (id, organization_id, name, grade, academic_year, status)
         VALUES ($1, $2, 'Beta Grade 10', '10', '2026-2027', 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [orgBClassId, orgBId],
      );
      await client.query(
        `INSERT INTO sections (id, class_id, name, max_students, status)
         VALUES ($1, $2, 'Beta Section A', 30, 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [orgBSectionId, orgBClassId],
      );
      await client.query(
        `INSERT INTO questions (id, organization_id, created_by, title, description, question_type, difficulty, topic, marks, status)
         VALUES ($1, $2, $3, 'Org Beta Private Question', 'Secret Beta org prompt', 'MCQ', 'EASY', 'Private', 10, 'PUBLISHED')
         ON CONFLICT (id) DO NOTHING`,
        [orgBQuestionId, orgBId, orgBAdminId],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    owner = await loginAs('admin@lplatform.dev', 'Admin@123');
    developer = await loginAs('developer@lplatform.dev', 'Dev@123');
    orgAdminA = await loginAs('priya.sharma@riverside.edu', 'OrgAdmin@123');
    teacherA = await loginAs('teacher@riverside.edu', 'Teacher@123');
    student1A = await loginAs('student1@riverside.edu', 'Student@123');
    student2A = await loginAs('student2@riverside.edu', 'Student@123');
    independentLearner = await loginAs('learner@lplatform.dev', 'Student@123');
    orgBAdmin = await loginAs(`beta.admin.${runTag}@orgb.test`, 'TenantTest@123');
    orgBStudent = await loginAs(`beta.student.${runTag}@orgb.test`, 'TenantTest@123');
  });

  afterAll(async () => {
    await runWithRlsContext({ systemContext: 'SUPERUSER' }, async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (createdAttemptIds.length > 0) {
          await client.query(
            `DELETE FROM course_assessment_reviews WHERE attempt_id = ANY($1::text[])`,
            [createdAttemptIds],
          );
          await client.query(
            `DELETE FROM course_assessment_answers WHERE attempt_id = ANY($1::text[])`,
            [createdAttemptIds],
          );
          await client.query(`DELETE FROM course_assessment_attempts WHERE id = ANY($1::text[])`, [
            createdAttemptIds,
          ]);
        }
        await client.query(
          `DELETE FROM course_lesson_progress WHERE student_id = 'usr-learner-001'`,
        );
        if (createdSubmissionIds.length > 0) {
          await client.query(`DELETE FROM submissions WHERE id = ANY($1::text[])`, [
            createdSubmissionIds,
          ]);
        }
        if (createdAssignmentIds.length > 0) {
          await client.query(`DELETE FROM submissions WHERE assignment_id = ANY($1::text[])`, [
            createdAssignmentIds,
          ]);
          await client.query(
            `DELETE FROM assignment_questions WHERE assignment_id = ANY($1::text[])`,
            [createdAssignmentIds],
          );
          await client.query(`DELETE FROM assignments WHERE id = ANY($1::text[])`, [
            createdAssignmentIds,
          ]);
        }
        if (createdAssessmentIds.length > 0) {
          await client.query(
            `DELETE FROM course_assessment_reviews WHERE attempt_id IN (SELECT id FROM course_assessment_attempts WHERE assessment_id = ANY($1::text[]))`,
            [createdAssessmentIds],
          );
          await client.query(
            `DELETE FROM course_assessment_answers WHERE attempt_id IN (SELECT id FROM course_assessment_attempts WHERE assessment_id = ANY($1::text[]))`,
            [createdAssessmentIds],
          );
          await client.query(
            `DELETE FROM course_assessment_attempts WHERE assessment_id = ANY($1::text[])`,
            [createdAssessmentIds],
          );
          await client.query(
            `DELETE FROM course_assessment_assignments WHERE assessment_id = ANY($1::text[])`,
            [createdAssessmentIds],
          );
          await client.query(
            `DELETE FROM course_assessment_questions WHERE assessment_id = ANY($1::text[])`,
            [createdAssessmentIds],
          );
          await client.query(`DELETE FROM course_assessments WHERE id = ANY($1::text[])`, [
            createdAssessmentIds,
          ]);
        }
        if (createdCaaIds.length > 0) {
          await client.query(
            `DELETE FROM course_assessment_assignments WHERE id = ANY($1::text[])`,
            [createdCaaIds],
          );
        }
        if (createdQuestionIds.length > 0) {
          await client.query(`DELETE FROM question_options WHERE question_id = ANY($1::text[])`, [
            createdQuestionIds,
          ]);
          await client.query(`DELETE FROM questions WHERE id = ANY($1::text[])`, [
            createdQuestionIds,
          ]);
        }
        if (createdSectionIds.length > 0) {
          await client.query(
            `DELETE FROM course_assessment_assignments WHERE section_id = ANY($1::text[])`,
            [createdSectionIds],
          );
          await client.query(
            `DELETE FROM teacher_section_memberships WHERE section_id = ANY($1::text[])`,
            [createdSectionIds],
          );
          await client.query(
            `DELETE FROM student_section_memberships WHERE section_id = ANY($1::text[])`,
            [createdSectionIds],
          );
          await client.query(`DELETE FROM sections WHERE id = ANY($1::text[])`, [
            createdSectionIds,
          ]);
        }
        await client.query(`DELETE FROM student_section_memberships WHERE section_id = $1`, [
          orgBSectionId,
        ]);
        await client.query(`DELETE FROM refresh_sessions WHERE user_id = ANY($1::text[])`, [
          createdUserIds,
        ]);
        await client.query(
          `DELETE FROM teacher_section_memberships WHERE teacher_id = ANY($1::text[])`,
          [createdUserIds],
        );
        await client.query(
          `DELETE FROM student_section_memberships WHERE student_id = ANY($1::text[])`,
          [createdUserIds],
        );
        await client.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [createdUserIds]);
        await client.query(`DELETE FROM organizations WHERE id = $1`, [orgBId]);
        await client.query('COMMIT');
      } finally {
        client.release();
      }
    });
    await app.close();
  });

  it('refuses insecure fallback secrets, missing CORS, and production demo reset when NODE_ENV=production', () => {
    const prevEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'short';
      expect(() => getJwtSecret()).toThrow(/at least 32 characters/i);

      process.env.JWT_SECRET = 'dev-super-secure-jwt-secret-key-at-least-32-chars-long!';
      expect(() => getJwtSecret()).toThrow(/default placeholder/i);

      process.env.COOKIE_SECRET = 'cookie-secret-change-in-production-long-random-string';
      expect(() => getCookieSecret()).toThrow(/default placeholder/i);

      delete process.env.DATABASE_URL;
      expect(() => getDatabaseUrl()).toThrow(/DATABASE_URL must be configured/i);

      delete process.env.CORS_ORIGIN;
      delete process.env.ALLOWED_ORIGINS;
      expect(() => getAllowedCorsOrigins()).toThrow(/CORS_ORIGIN or ALLOWED_ORIGINS/i);

      process.env.ENABLE_DEMO_RESET = 'true';
      expect(isDemoResetAllowed()).toBe(false);
    } finally {
      process.env = prevEnv;
    }
  });

  it('blocks /api/settings/reset-demo in production or when ENABLE_DEMO_RESET=false and enforces CORS allowlist', async () => {
    const evilCors = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        origin: 'https://evil.attacker.invalid',
        'access-control-request-method': 'POST',
      },
    });
    expect(evilCors.headers['access-control-allow-origin']).not.toBe(
      'https://evil.attacker.invalid',
    );
    expect(evilCors.headers['access-control-allow-origin']).not.toBe('*');

    const okCors = await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
      },
    });
    expect(okCors.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const prevDemo = process.env.ENABLE_DEMO_RESET;
    process.env.ENABLE_DEMO_RESET = 'false';
    try {
      const blocked = await app.inject({
        method: 'POST',
        url: '/api/settings/reset-demo',
        headers: { authorization: `Bearer ${owner.accessToken}` },
      });
      expect(blocked.statusCode).toBe(403);
    } finally {
      process.env.ENABLE_DEMO_RESET = prevDemo;
    }
  });

  it('enforces PostgreSQL lplatform_app FORCE ROW LEVEL SECURITY across tenants and PLATFORM_DEVELOPER', async () => {
    const roleCheck = await pool.query(
      `SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'lplatform_app'`,
    );
    expect(roleCheck.rowCount).toBe(1);
    expect(roleCheck.rows[0].rolbypassrls).toBe(false);

    const client = await pool.connect();
    try {
      // 1. PLATFORM_DEVELOPER sees zero student/user PII and zero submissions via SQL RLS
      await client.query('BEGIN');
      await applySessionRlsVars(client, {
        userId: developer.user.id,
        role: 'PLATFORM_DEVELOPER',
        organizationId: null,
      });
      const devUsers = await client.query(`SELECT id FROM users`);
      const devOrgs = await client.query(`SELECT id FROM organizations`);
      const devSubs = await client.query(`SELECT id FROM submissions`);
      const devPlatformCourses = await client.query(
        `SELECT id FROM courses WHERE id = 'crs-ai-readiness-001'`,
      );
      await client.query('ROLLBACK');

      expect(devUsers.rows.every((u: { id: string }) => u.id === developer.user.id)).toBe(true);
      expect(devOrgs.rowCount).toBe(0);
      expect(devSubs.rowCount).toBe(0);
      expect(devPlatformCourses.rowCount).toBe(1);

      // 2. Org Beta Admin cannot read Org Alpha (Riverside) users or sections via SQL RLS
      await client.query('BEGIN');
      await applySessionRlsVars(client, {
        userId: orgBAdmin.user.id,
        role: 'ORGANIZATION_ADMIN',
        organizationId: orgBId,
      });
      const alphaUsersSeenByBeta = await client.query(
        `SELECT id FROM users WHERE organization_id = 'org-riverside-001'`,
      );
      const betaUsersSeenByBeta = await client.query(
        `SELECT id FROM users WHERE organization_id = $1`,
        [orgBId],
      );
      const betaSeenAlphaQs = await client.query(
        `SELECT id FROM questions WHERE organization_id = 'org-riverside-001'`,
      );
      await client.query('ROLLBACK');

      expect(alphaUsersSeenByBeta.rowCount).toBe(0);
      expect(betaUsersSeenByBeta.rowCount).toBeGreaterThanOrEqual(2);
      expect(betaSeenAlphaQs.rowCount).toBe(0);
    } finally {
      client.release();
    }
  });

  it('enforces PLATFORM_DEVELOPER isolation across HTTP endpoints', async () => {
    const devHeaders = { authorization: `Bearer ${developer.accessToken}` };

    // Permitted developer endpoints
    const integRes = await app.inject({
      method: 'GET',
      url: '/api/platform/integrations/status',
      headers: devHeaders,
    });
    expect(integRes.statusCode).toBe(200);
    const integBody = JSON.parse(integRes.payload);
    expect(integBody.oci.objectStorageConfigured).toBe(false);
    expect(JSON.stringify(integBody)).not.toContain('service_role');

    const rolesRes = await app.inject({
      method: 'GET',
      url: '/api/platform/roles',
      headers: devHeaders,
    });
    expect(rolesRes.statusCode).toBe(200);

    const coursesRes = await app.inject({
      method: 'GET',
      url: '/api/courses',
      headers: devHeaders,
    });
    expect(coursesRes.statusCode).toBe(200);
    const courseItems = JSON.parse(coursesRes.payload).items as Array<{
      isPlatformCourse: boolean;
    }>;
    expect(courseItems.length).toBeGreaterThanOrEqual(1);
    expect(courseItems.every((c) => c.isPlatformCourse === true)).toBe(true);

    const bankRes = await app.inject({
      method: 'GET',
      url: '/api/questions?pageSize=20',
      headers: devHeaders,
    });
    expect(bankRes.statusCode).toBe(200);
    const bankItems = JSON.parse(bankRes.payload).items as Array<{ id: string }>;
    expect(bankItems.some((q) => q.id === orgBQuestionId)).toBe(false);

    // Strictly forbidden student PII, tenant, submission & audit endpoints
    const blockedUrls = [
      '/api/organizations',
      '/api/users',
      '/api/assignments',
      '/api/submissions',
      '/api/teacher/assessment-reviews',
      '/api/audit-logs',
      '/api/reports/overview',
      '/api/reports/onboarding-series',
      '/api/teacher/students/usr-student-001/profile',
    ];
    for (const url of blockedUrls) {
      const r = await app.inject({ method: 'GET', url, headers: devHeaders });
      expect(r.statusCode, `Expected 403 for developer on ${url}, got ${r.statusCode}`).toBe(403);
    }

    // Cannot create or modify organization-owned question or assign assessment to section
    const orgQAttempt = await app.inject({
      method: 'POST',
      url: '/api/questions',
      headers: devHeaders,
      payload: {
        title: 'Bypass org check',
        description: 'Attempt to inject org question',
        questionType: 'MCQ',
        difficulty: 'EASY',
        topic: 'Test',
        organizationId: orgBId,
      },
    });
    expect(orgQAttempt.statusCode).toBe(403);
  });

  it('hides section rosters (classmate data) from students but not from their teacher', async () => {
    const studentRes = await app.inject({
      method: 'GET',
      url: '/api/sections/sec-grade10a-001/roster',
      headers: { authorization: `Bearer ${student1A.accessToken}` },
    });
    expect(studentRes.statusCode).toBe(403);

    const teacherRes = await app.inject({
      method: 'GET',
      url: '/api/sections/sec-grade10a-001/roster',
      headers: { authorization: `Bearer ${teacherA.accessToken}` },
    });
    expect(teacherRes.statusCode).toBe(200);
  });

  it('blocks privilege escalation and cross-tenant mutations on users and sections', async () => {
    const orgAdminHeaders = { authorization: `Bearer ${orgAdminA.accessToken}` };
    const orgBAdminHeaders = { authorization: `Bearer ${orgBAdmin.accessToken}` };

    // OrgAdmin cannot create a PLATFORM_OWNER or PLATFORM_DEVELOPER user
    for (const targetRole of ['PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'PLATFORM_ADMIN']) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: orgAdminHeaders,
        payload: {
          firstName: 'Escalated',
          lastName: 'User',
          email: `esc.${targetRole.toLowerCase()}.${runTag}@riverside.edu`,
          role: targetRole,
        },
      });
      expect(res.statusCode).toBe(403);
    }

    // OrgAdmin A cannot inspect or modify Org B student
    const crossRead = await app.inject({
      method: 'GET',
      url: `/api/users/${orgBStudentId}`,
      headers: orgAdminHeaders,
    });
    expect([403, 404]).toContain(crossRead.statusCode);

    const crossSuspend = await app.inject({
      method: 'PATCH',
      url: `/api/users/${orgBStudentId}/status`,
      headers: orgAdminHeaders,
      payload: { status: 'SUSPENDED' },
    });
    expect([403, 404]).toContain(crossSuspend.statusCode);

    // Org B Admin cannot enroll Org A student into Org B section
    const crossEnroll = await app.inject({
      method: 'POST',
      url: `/api/sections/${orgBSectionId}/students`,
      headers: orgBAdminHeaders,
      payload: { studentId: 'usr-student-001' },
    });
    expect([400, 403, 404]).toContain(crossEnroll.statusCode);
  });

  it('Workflow A: Independent org-less student takes free AI Readiness Course & self-paced objective assessment', async () => {
    const learnerHeaders = { authorization: `Bearer ${independentLearner.accessToken}` };

    const catalogRes = await app.inject({
      method: 'GET',
      url: '/api/learning/courses',
      headers: learnerHeaders,
    });
    expect(catalogRes.statusCode).toBe(200);
    const catalogItems = JSON.parse(catalogRes.payload).items as Array<{
      id: string;
      scopeType: string;
      accessEnabled: boolean;
    }>;
    const aiCourse = catalogItems.find((c) => c.id === 'crs-ai-readiness-001');
    expect(aiCourse).toBeTruthy();
    expect(aiCourse?.scopeType).toBe('PLATFORM_FREE');
    expect(aiCourse?.accessEnabled).toBe(true);

    const courseRes = await app.inject({
      method: 'GET',
      url: '/api/learning/ai-readiness',
      headers: learnerHeaders,
    });
    expect(courseRes.statusCode).toBe(200);
    const courseData = JSON.parse(courseRes.payload) as {
      estimatedMinutes?: number;
      modules: Array<{ id: string; lessons: Array<{ id: string }> }>;
    };
    expect(courseData.modules).toHaveLength(8);
    expect(JSON.stringify(courseData)).not.toMatch(/Class\s*(XI|11)/i);

    const progressRes = await app.inject({
      method: 'POST',
      url: '/api/learning/progress/lessons',
      headers: learnerHeaders,
      payload: {
        moduleId: courseData.modules[0].id,
        lessonIndex: 0,
      },
    });
    expect(progressRes.statusCode).toBe(200);

    const listAssessRes = await app.inject({
      method: 'GET',
      url: '/api/learning/assessments',
      headers: learnerHeaders,
    });
    expect(listAssessRes.statusCode).toBe(200);
    const assessItems = JSON.parse(listAssessRes.payload) as Array<{
      assessmentId: string;
      moduleId: string;
      scope: string;
    }>;
    expect(assessItems.length).toBeGreaterThanOrEqual(8);
    const m1Assessment = assessItems.find((a) => a.moduleId === 'm1-ai-foundations');
    expect(m1Assessment).toBeTruthy();

    // Start M1 platform assessment without assignmentId/organizationId
    const startRes = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${m1Assessment!.assessmentId}/attempts`,
      headers: learnerHeaders,
    });
    expect(startRes.statusCode).toBe(200);
    const attempt = JSON.parse(startRes.payload) as {
      attemptId: string;
      questions: Array<{ id: string; type: string; options: Array<{ id: string; text: string }> }>;
    };
    createdAttemptIds.push(attempt.attemptId);
    expect(attempt.questions.length).toBeGreaterThanOrEqual(5);
    // Ensure answer keys & option correctness are strictly stripped for STUDENT
    const serialized = JSON.stringify(attempt.questions);
    expect(serialized).not.toContain('isCorrect');
    expect(serialized).not.toContain('answerKey');

    const answersPayload: Record<string, unknown> = {};
    for (const q of attempt.questions) {
      if (q.options.length > 0) {
        answersPayload[q.id] = q.options[0].id;
      } else {
        answersPayload[q.id] = 'Self-paced written response test';
      }
    }

    for (const [questionId, response] of Object.entries(answersPayload)) {
      const saveRes = await app.inject({
        method: 'PUT',
        url: `/api/learning/attempts/${attempt.attemptId}/answers/${questionId}`,
        headers: learnerHeaders,
        payload: { response },
      });
      expect(saveRes.statusCode).toBe(200);
    }

    // Resume and verify unwrapped savedAnswers (no { value: ... } wrapper!)
    const resumeRes = await app.inject({
      method: 'GET',
      url: `/api/learning/attempts/${attempt.attemptId}`,
      headers: learnerHeaders,
    });
    expect(resumeRes.statusCode).toBe(200);
    const resumed = JSON.parse(resumeRes.payload) as { savedAnswers: Record<string, unknown> };
    const firstQId = attempt.questions[0].id;
    expect(resumed.savedAnswers[firstQId]).toEqual(answersPayload[firstQId]);

    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/learning/attempts/${attempt.attemptId}/submit`,
      headers: learnerHeaders,
      payload: { answers: answersPayload },
    });
    expect(submitRes.statusCode).toBe(200);
    const submitted = JSON.parse(submitRes.payload) as { status: string; score: number | null };
    expect(['RELEASED', 'PENDING_REVIEW']).toContain(submitted.status);

    const resultsRes = await app.inject({
      method: 'GET',
      url: '/api/learning/results',
      headers: learnerHeaders,
    });
    expect(resultsRes.statusCode).toBe(200);
    const results = JSON.parse(resultsRes.payload).items as Array<{ attemptId: string }>;
    expect(results.some((r) => r.attemptId === attempt.attemptId)).toBe(true);
  });

  it('Workflow B & C: Teacher authors >3-question multi-type assessment/assignment, grades manually & releases feedback', async () => {
    const teacherHeaders = { authorization: `Bearer ${teacherA.accessToken}` };
    const stu1Headers = { authorization: `Bearer ${student1A.accessToken}` };
    const stu2Headers = { authorization: `Bearer ${student2A.accessToken}` };

    // Fetch 6 questions across AI Readiness bank (verify >3 limit fixed, pageSize=500)
    const qBankRes = await app.inject({
      method: 'GET',
      url: '/api/questions?courseId=crs-ai-readiness-001&pageSize=500',
      headers: teacherHeaders,
    });
    expect(qBankRes.statusCode).toBe(200);
    const qBankBody = JSON.parse(qBankRes.payload) as {
      items: Array<{ id: string; questionType: string }>;
      total: number;
    };
    expect(qBankBody.total).toBeGreaterThanOrEqual(352);
    expect(qBankBody.items.length).toBeGreaterThanOrEqual(352);

    const mcqQ = qBankBody.items.find(
      (q) => q.questionType === 'SINGLE_MCQ' || q.questionType === 'MCQ',
    )!;
    const shortQ = qBankBody.items.find((q) => q.questionType === 'SHORT_ANSWER')!;
    const caseQ = qBankBody.items.find(
      (q) => q.questionType === 'LONG_CASE' || q.questionType === 'CASE_STUDY',
    )!;
    const pracOrCoding = qBankBody.items
      .filter(
        (q) =>
          q.questionType === 'PRACTICAL' ||
          q.questionType === 'CODE' ||
          q.questionType === 'CODING',
      )
      .slice(0, 3);
    expect(mcqQ && shortQ && caseQ && pracOrCoding.length >= 2).toBeTruthy();
    const codeBankRes = await app.inject({
      method: 'GET',
      url: '/api/questions?questionType=CODE&pageSize=20',
      headers: teacherHeaders,
    });
    const codeBankItems = JSON.parse(codeBankRes.payload).items as Array<{ id: string }>;
    const codingQId = codeBankItems[0]?.id ?? pracOrCoding[0].id;
    const sixQuestionIds = [
      mcqQ.id,
      shortQ.id,
      caseQ.id,
      codingQId,
      pracOrCoding[0].id,
      pracOrCoding[1].id,
    ];

    // 1. Create a 5-question CASE_STUDY assignment (proving >3-question authoring & non-coding assignment)
    const asgCreateRes = await app.inject({
      method: 'POST',
      url: '/api/assignments',
      headers: teacherHeaders,
      payload: {
        sectionId: 'sec-grade10a-001',
        courseId: 'crs-ai-readiness-001',
        assignmentType: 'CASE_STUDY',
        title: `Ethics Multi-Part Study ${runTag}`,
        description: '5-question case analysis with manual teacher grading.',
        dueDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        status: 'DRAFT',
        questions: sixQuestionIds.slice(0, 5).map((id, i) => ({
          questionId: id,
          marks: 10,
          orderNum: i + 1,
        })),
      },
    });
    expect(asgCreateRes.statusCode).toBe(201);
    const createdAsg = JSON.parse(asgCreateRes.payload) as { id: string; assignmentType: string };
    createdAssignmentIds.push(createdAsg.id);
    expect(createdAsg.assignmentType).toBe('CASE_STUDY');

    // Draft assignment MUST NOT be readable by student (either 403 or RLS-hidden 404)
    const draftBlocked = await app.inject({
      method: 'GET',
      url: `/api/assignments/${createdAsg.id}`,
      headers: stu1Headers,
    });
    expect([403, 404]).toContain(draftBlocked.statusCode);

    // Publish assignment
    const pubAsgRes = await app.inject({
      method: 'PATCH',
      url: `/api/assignments/${createdAsg.id}/publish`,
      headers: teacherHeaders,
    });
    expect(pubAsgRes.statusCode).toBe(200);

    // Student views published assignment (has 5 questions, strips answerKey/rubric/isCorrect)
    const stuAsgRes = await app.inject({
      method: 'GET',
      url: `/api/assignments/${createdAsg.id}`,
      headers: stu1Headers,
    });
    expect(stuAsgRes.statusCode).toBe(200);
    const stuAsg = JSON.parse(stuAsgRes.payload) as {
      questions: Array<{ question: { id: string } }>;
    };
    expect(stuAsg.questions).toHaveLength(5);
    expect(JSON.stringify(stuAsg.questions)).not.toContain('answerKey');
    expect(JSON.stringify(stuAsg.questions)).not.toContain('isCorrect');

    // Unconfigured OCI upload endpoint MUST fail closed with 503 OCI_NOT_CONFIGURED
    const ociUploadRes = await app.inject({
      method: 'POST',
      url: '/api/submissions/attachment-upload',
      headers: stu1Headers,
      payload: {
        assignmentId: createdAsg.id,
        questionId: caseQ.id,
        fileName: 'report.pdf',
      },
    });
    expect(ociUploadRes.statusCode).toBe(503);
    expect(JSON.parse(ociUploadRes.payload).code).toBe('OCI_NOT_CONFIGURED');

    // Student submits written response -> accepted with 202 PENDING_REVIEW (no server execution)
    const subWrittenRes = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      headers: stu1Headers,
      payload: {
        assignmentId: createdAsg.id,
        questionId: caseQ.id,
        language: 'TEXT',
        textResponse:
          'Data bias mitigation requires stratified auditing across demographic slices.',
      },
    });
    expect(subWrittenRes.statusCode).toBe(202);
    const subWritten = JSON.parse(subWrittenRes.payload) as {
      id: string;
      status: string;
      score: number | null;
    };
    createdSubmissionIds.push(subWritten.id);
    expect(subWritten.status).toBe('PENDING_REVIEW');
    expect(subWritten.score).toBeNull();

    // Student submits coding question -> stored as PENDING (evaluator remains disconnected)
    const subCodeRes = await app.inject({
      method: 'POST',
      url: '/api/submissions',
      headers: stu1Headers,
      payload: {
        assignmentId: createdAsg.id,
        questionId: codingQId,
        language: 'PYTHON',
        code: 'import os\nprint("not executed on server")',
      },
    });
    expect(subCodeRes.statusCode).toBe(202);
    const subCode = JSON.parse(subCodeRes.payload) as { id: string; status: string };
    createdSubmissionIds.push(subCode.id);
    expect(subCode.status).toBe('PENDING');

    // Other student (student2) cannot view student1 submission
    const crossStuSub = await app.inject({
      method: 'GET',
      url: `/api/submissions/${subWritten.id}`,
      headers: stu2Headers,
    });
    expect([403, 404]).toContain(crossStuSub.statusCode);

    // Org Beta student cannot view Org Alpha assignment
    const crossOrgAsg = await app.inject({
      method: 'GET',
      url: `/api/assignments/${createdAsg.id}`,
      headers: { authorization: `Bearer ${orgBStudent.accessToken}` },
    });
    expect([403, 404]).toContain(crossOrgAsg.statusCode);

    // Teacher grades written submission WITHOUT releasing yet -> student still sees score: null
    const draftGradeRes = await app.inject({
      method: 'PATCH',
      url: `/api/submissions/${subWritten.id}/grade`,
      headers: teacherHeaders,
      payload: {
        score: 8,
        teacherFeedback: 'Draft teacher comment',
        releaseFeedback: false,
      },
    });
    expect(draftGradeRes.statusCode).toBe(200);

    const beforeReleaseRes = await app.inject({
      method: 'GET',
      url: `/api/submissions/${subWritten.id}`,
      headers: stu1Headers,
    });
    expect(beforeReleaseRes.statusCode).toBe(200);
    const beforeRelease = JSON.parse(beforeReleaseRes.payload) as {
      score: number | null;
      teacherFeedback: string | null;
      feedbackReleased: boolean;
    };
    expect(beforeRelease.feedbackReleased).toBe(false);
    expect(beforeRelease.score).toBeNull();
    expect(beforeRelease.teacherFeedback).toBeNull();

    // Teacher releases graded feedback -> student sees score & teacherFeedback
    const releaseGradeRes = await app.inject({
      method: 'PATCH',
      url: `/api/submissions/${subWritten.id}/grade`,
      headers: teacherHeaders,
      payload: {
        score: 9,
        teacherFeedback: 'Well reasoned fairness analysis.',
        releaseFeedback: true,
      },
    });
    expect(releaseGradeRes.statusCode).toBe(200);

    const afterReleaseRes = await app.inject({
      method: 'GET',
      url: `/api/submissions/${subWritten.id}`,
      headers: stu1Headers,
    });
    const afterRelease = JSON.parse(afterReleaseRes.payload) as {
      score: number | null;
      teacherFeedback: string | null;
      feedbackReleased: boolean;
    };
    expect(afterRelease.feedbackReleased).toBe(true);
    expect(afterRelease.score).toBe(9);
    expect(afterRelease.teacherFeedback).toBe('Well reasoned fairness analysis.');

    // 2. Teacher creates 4-question mixed assessment, publishes, assigns, student attempts & teacher releases
    const createAsmtRes = await app.inject({
      method: 'POST',
      url: '/api/assessments',
      headers: teacherHeaders,
      payload: {
        courseId: 'crs-ai-readiness-001',
        moduleId: 'mod-ai-1',
        title: `Section Quiz ${runTag}`,
        instructions: 'Answer both MCQ and short-answer items.',
        status: 'PUBLISHED',
        questionIds: [mcqQ.id, shortQ.id, pracOrCoding[0].id, pracOrCoding[1].id],
        sectionIds: ['sec-grade10a-001'],
      },
    });
    expect(createAsmtRes.statusCode).toBe(201);
    const createdAsmt = JSON.parse(createAsmtRes.payload) as { id: string; scope: string };
    createdAssessmentIds.push(createdAsmt.id);
    expect(createdAsmt.scope).toBe('SECTION');

    const stuAsmtList = await app.inject({
      method: 'GET',
      url: '/api/learning/assessments',
      headers: stu1Headers,
    });
    const assignedCard = (
      JSON.parse(stuAsmtList.payload) as Array<{
        assessmentId: string;
        assignmentId: string | null;
      }>
    ).find((a) => a.assessmentId === createdAsmt.id);
    expect(assignedCard?.assignmentId).toBeTruthy();

    const startAssignedRes = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${assignedCard!.assignmentId}/attempts`,
      headers: stu1Headers,
    });
    expect(startAssignedRes.statusCode).toBe(200);
    const assignedAttempt = JSON.parse(startAssignedRes.payload) as {
      attemptId: string;
      questions: Array<{ id: string; options: Array<{ id: string }> }>;
    };
    createdAttemptIds.push(assignedAttempt.attemptId);

    const submitAssignedRes = await app.inject({
      method: 'POST',
      url: `/api/learning/attempts/${assignedAttempt.attemptId}/submit`,
      headers: stu1Headers,
      payload: {
        answers: {
          [mcqQ.id]:
            assignedAttempt.questions.find((q) => q.id === mcqQ.id)?.options[0]?.id ?? 'Option A',
          [shortQ.id]: 'Structured intelligence vs human general intelligence.',
        },
      },
    });
    expect(submitAssignedRes.statusCode).toBe(200);
    expect(JSON.parse(submitAssignedRes.payload).status).toBe('PENDING_REVIEW');

    // Teacher reviews & releases attempt
    const reviewsRes = await app.inject({
      method: 'GET',
      url: '/api/teacher/assessment-reviews',
      headers: teacherHeaders,
    });
    expect(reviewsRes.statusCode).toBe(200);
    const pendingReviews = JSON.parse(reviewsRes.payload) as Array<{
      attemptId: string;
      answerId: string;
      questionId: string;
    }>;
    const attemptReviewItems = pendingReviews.filter(
      (r) => r.attemptId === assignedAttempt.attemptId,
    );
    const reviewItem = attemptReviewItems.find((r) => r.questionId === shortQ.id);
    expect(reviewItem).toBeDefined();

    for (const item of attemptReviewItems) {
      const gradeAnswerRes = await app.inject({
        method: 'POST',
        url: `/api/teacher/assessment-answers/${item.answerId}/review`,
        headers: teacherHeaders,
        payload: {
          marksAwarded: item.questionId === shortQ.id ? 1 : 0,
          feedback:
            item.questionId === shortQ.id
              ? 'Clear contrast provided.'
              : 'Skipped manual-review item.',
        },
      });
      expect(gradeAnswerRes.statusCode).toBe(200);
      expect(JSON.parse(gradeAnswerRes.payload).reviewed).toBe(true);
    }

    const releaseAsmtRes = await app.inject({
      method: 'POST',
      url: `/api/teacher/assessment-attempts/${assignedAttempt.attemptId}/release`,
      headers: teacherHeaders,
      payload: {},
    });
    expect(releaseAsmtRes.statusCode).toBe(200);
    expect(JSON.parse(releaseAsmtRes.payload).released).toBe(true);

    const stuResultsRes = await app.inject({
      method: 'GET',
      url: '/api/learning/results',
      headers: stu1Headers,
    });
    expect(stuResultsRes.statusCode).toBe(200);
    const stuResultsBody = JSON.parse(stuResultsRes.payload) as {
      items: Array<{
        attemptId: string;
        status: string;
        score: number | null;
      }>;
    };
    const releasedResult = stuResultsBody.items.find(
      (r) => r.attemptId === assignedAttempt.attemptId,
    );
    expect(releasedResult?.status).toBe('RELEASED');
    expect(releasedResult?.score).not.toBeNull();
  });

  it('Workflow D: Bulk CSV student roster preview/confirm, section bulk enroll & onboarding report series', async () => {
    const orgAdminHeaders = { authorization: `Bearer ${orgAdminA.accessToken}` };
    const teacherHeaders = { authorization: `Bearer ${teacherA.accessToken}` };
    const csvEmail1 = `csv.stu1.${runTag}@riverside.edu`;
    const csvEmail2 = `csv.stu2.${runTag}@riverside.edu`;

    const csvText = [
      'email,firstName,lastName,role',
      `${csvEmail1},Neha,Patel,STUDENT`,
      `${csvEmail2},Rohan,Kapoor,STUDENT`,
      `bad-not-an-email,Bad,Row,STUDENT`,
      `hack.${runTag}@riverside.edu,Evil,Admin,PLATFORM_OWNER`,
    ].join('\n');

    const previewRes = await app.inject({
      method: 'POST',
      url: '/api/users/import/preview',
      headers: orgAdminHeaders,
      payload: { csvText, fileName: 'roster.csv' },
    });
    expect(previewRes.statusCode).toBe(200);
    const preview = JSON.parse(previewRes.payload) as {
      validRows: number;
      invalidRows: number;
      rows: Array<{
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        isValid: boolean;
      }>;
    };
    expect(preview.validRows).toBe(2);
    expect(preview.invalidRows).toBe(2); // invalid email + disallowed PLATFORM_OWNER role for OrgAdmin

    const validRows = preview.rows.filter((r) => r.isValid);
    const confirmRes = await app.inject({
      method: 'POST',
      url: '/api/users/import/confirm',
      headers: orgAdminHeaders,
      payload: { rows: validRows },
    });
    expect(confirmRes.statusCode).toBe(200);
    const confirmed = JSON.parse(confirmRes.payload) as {
      imported: number;
      created: Array<{ id: string }>;
    };
    expect(confirmed.imported).toBe(2);
    for (const u of confirmed.created) createdUserIds.push(u.id);

    const bulkEnrollRes = await app.inject({
      method: 'POST',
      url: '/api/sections/sec-grade10a-001/students/bulk',
      headers: teacherHeaders,
      payload: { csvText: `${csvEmail1}\n${csvEmail2}\nmissing.${runTag}@other.org` },
    });
    expect(bulkEnrollRes.statusCode).toBe(200);
    const bulkBody = JSON.parse(bulkEnrollRes.payload) as {
      assigned: number;
      errors: string[];
    };
    expect(bulkBody.assigned).toBe(2);
    expect(bulkBody.errors.some((e) => e.includes(`missing.${runTag}@other.org`))).toBe(true);

    const onboardingRes = await app.inject({
      method: 'GET',
      url: '/api/reports/onboarding-series',
      headers: orgAdminHeaders,
    });
    expect(onboardingRes.statusCode).toBe(200);
    const onboarding = JSON.parse(onboardingRes.payload) as Array<{
      month: string;
      students: number;
      teachers: number;
    }>;
    expect(onboarding.length).toBeGreaterThanOrEqual(1);
    expect(onboarding.some((p) => p.students >= 2)).toBe(true);
  });

  it('allows same-org student self-join under RLS (POST /api/learning/classes/join) while blocking cross-org and independent learners', async () => {
    const secJoinId = `sec-join-${runTag}`;
    createdSectionIds.push(secJoinId);

    await runWithRlsContext({ systemContext: 'SUPERUSER' }, async () => {
      await pool.query(
        `INSERT INTO sections (id, class_id, name, max_students, status)
         VALUES ($1, 'cls-grade10-001', 'Join Regression Section', 25, 'ACTIVE')
         ON CONFLICT (id) DO NOTHING`,
        [secJoinId],
      );
    });

    // Cross-org student cannot join org A section even with exact code
    const crossOrgJoin = await app.inject({
      method: 'POST',
      url: '/api/learning/classes/join',
      headers: { authorization: `Bearer ${orgBStudent.accessToken}` },
      payload: { code: secJoinId },
    });
    expect(crossOrgJoin.statusCode).toBe(404);

    // Independent platform learner (null organization) is forbidden from org class join
    const indepJoin = await app.inject({
      method: 'POST',
      url: '/api/learning/classes/join',
      headers: { authorization: `Bearer ${independentLearner.accessToken}` },
      payload: { code: secJoinId },
    });
    expect(indepJoin.statusCode).toBe(403);

    // Same-org student joins unjoined section via uppercase invite code under JOIN_LOOKUP RLS context
    const stu2Headers = { authorization: `Bearer ${student2A.accessToken}` };
    const firstJoin = await app.inject({
      method: 'POST',
      url: '/api/learning/classes/join',
      headers: stu2Headers,
      payload: { code: secJoinId.toUpperCase() },
    });
    expect(firstJoin.statusCode, firstJoin.payload).toBe(201);
    const firstBody = JSON.parse(firstJoin.payload) as {
      joined: boolean;
      alreadyEnrolled: boolean;
      sectionId: string;
    };
    expect(firstBody.joined).toBe(true);
    expect(firstBody.alreadyEnrolled).toBe(false);
    expect(firstBody.sectionId).toBe(secJoinId);

    const classesRes = await app.inject({
      method: 'GET',
      url: '/api/learning/classes',
      headers: stu2Headers,
    });
    expect(classesRes.statusCode).toBe(200);
    const classesBody = JSON.parse(classesRes.payload) as {
      items: Array<{ id: string }>;
    };
    expect(classesBody.items.some((s) => s.id === secJoinId)).toBe(true);

    // Idempotent repeat join returns 200 alreadyEnrolled=true
    const repeatJoin = await app.inject({
      method: 'POST',
      url: '/api/learning/classes/join',
      headers: stu2Headers,
      payload: { code: secJoinId },
    });
    expect(repeatJoin.statusCode).toBe(200);
    expect(JSON.parse(repeatJoin.payload).alreadyEnrolled).toBe(true);
  });

  it('queues skipped written questions for review, enforces strict per-section teacher isolation on review/release/upload, grades from immutable snapshots, and isolates platform vs assigned attempts', async () => {
    const teacher2Id = `sec-test-t2-${runTag}`;
    const teacher2Email = `teacher2.${runTag}@riverside.edu`;
    const secOtherId = `sec-other-${runTag}`;
    const qMcqId = `q-snap-mcq-${runTag}`;
    const optAId = `opt-snap-a-${runTag}`;
    const optBId = `opt-snap-b-${runTag}`;
    const qShortId = `q-skip-short-${runTag}`;
    const qPlatId = `q-plat-mcq-${runTag}`;
    const optPlatAId = `opt-plat-a-${runTag}`;

    createdUserIds.push(teacher2Id);
    createdSectionIds.push(secOtherId);
    createdQuestionIds.push(qMcqId, qShortId, qPlatId);

    const pwHash = await hashPassword('TeacherTest@123');
    await runWithRlsContext({ systemContext: 'SUPERUSER' }, async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
           VALUES ($1, 'org-riverside-001', 'Other', 'Teacher', $2, 'TEACHER', 'ACTIVE')`,
          [teacher2Id, teacher2Email],
        );
        await client.query(`INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)`, [
          teacher2Id,
          pwHash,
        ]);
        await client.query(
          `INSERT INTO sections (id, class_id, name, max_students, status)
           VALUES ($1, 'cls-grade10-001', 'Isolated Peer Section', 30, 'ACTIVE')`,
          [secOtherId],
        );
        await client.query(
          `INSERT INTO teacher_section_memberships (id, section_id, teacher_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')`,
          [`tsm-${runTag}`, secOtherId, teacher2Id],
        );
        // Student1A belongs to BOTH sec-grade10a-001 (teacherA) AND secOtherId (teacher2A)
        await client.query(
          `INSERT INTO student_section_memberships (id, section_id, student_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')`,
          [`ssm-${runTag}`, secOtherId, student1A.user.id],
        );
        await client.query(
          `INSERT INTO questions (
             id, organization_id, course_id, created_by, title, description,
             question_type, difficulty, topic, marks, answer_key, status
           )
           VALUES
             ($1, 'org-riverside-001', 'crs-ai-readiness-001', $3, 'Snapshot MCQ', 'Pick A', 'SINGLE_MCQ', 'EASY', 'Regression', 10, $4::jsonb, 'PUBLISHED'),
             ($2, 'org-riverside-001', 'crs-ai-readiness-001', $3, 'Skipped Written', 'Explain briefly', 'SHORT_ANSWER', 'EASY', 'Regression', 10, '{}'::jsonb, 'PUBLISHED'),
             ($5, NULL, 'crs-ai-readiness-001', 'usr-admin-001', 'Platform Isolation MCQ', 'Pick A', 'SINGLE_MCQ', 'EASY', 'Regression', 5, $6::jsonb, 'PUBLISHED')`,
          [
            qMcqId,
            qShortId,
            teacherA.user.id,
            JSON.stringify({ correct: optAId }),
            qPlatId,
            JSON.stringify({ correct: optPlatAId }),
          ],
        );
        await client.query(
          `INSERT INTO question_options (id, question_id, option_text, order_num, is_correct)
           VALUES
             ($1, $3, 'Option Alpha', 1, true),
             ($2, $3, 'Option Beta', 2, false),
             ($4, $5, 'Plat Alpha', 1, true)`,
          [optAId, optBId, qMcqId, optPlatAId, qPlatId],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    });

    const teacher2A = await loginAs(teacher2Email, 'TeacherTest@123');
    const teacherHeaders = { authorization: `Bearer ${teacherA.accessToken}` };
    const teacher2Headers = { authorization: `Bearer ${teacher2A.accessToken}` };
    const stu1Headers = { authorization: `Bearer ${student1A.accessToken}` };
    const stu2Headers = { authorization: `Bearer ${student2A.accessToken}` };

    // Teacher2 (not assigned to sec-grade10a-001) cannot authorize attachment uploads for sec-grade10a-001 assignments
    const unauthorizedUpload = await app.inject({
      method: 'POST',
      url: '/api/submissions/attachment-upload',
      headers: teacher2Headers,
      payload: {
        assignmentId: 'asg-python-hw1',
        fileName: 'notes.pdf',
        contentType: 'application/pdf',
        sizeBytes: 512,
      },
    });
    expect([403, 404]).toContain(unauthorizedUpload.statusCode);

    // TeacherA creates and publishes a mixed MCQ + SHORT_ANSWER assessment
    const createAsmt = await app.inject({
      method: 'POST',
      url: '/api/assessments',
      headers: teacherHeaders,
      payload: {
        courseId: 'crs-ai-readiness-001',
        moduleId: 'mod-ai-01',
        title: `Skip & Isolation Check ${runTag}`,
        status: 'PUBLISHED',
        attemptLimit: 2,
        passingMarks: 10,
        questionIds: [qMcqId, qShortId],
      },
    });
    expect(createAsmt.statusCode, createAsmt.payload).toBe(201);
    const createdAsmt = JSON.parse(createAsmt.payload) as { id: string };
    createdAssessmentIds.push(createdAsmt.id);

    // Mutate live bank options & answerKey AFTER publish to verify grading reads the frozen snapshot
    await runWithRlsContext({ systemContext: 'SUPERUSER' }, async () => {
      await pool.query(
        `UPDATE question_options
         SET is_correct = CASE WHEN id = $1 THEN false ELSE true END
         WHERE question_id = $2`,
        [optAId, qMcqId],
      );
      await pool.query(`UPDATE questions SET answer_key = $1::jsonb WHERE id = $2`, [
        JSON.stringify({ correct: optBId }),
        qMcqId,
      ]);
    });

    // Assign assessment strictly to sec-grade10a-001 (TeacherA's section)
    const assignRes = await app.inject({
      method: 'POST',
      url: `/api/assessments/${createdAsmt.id}/assign`,
      headers: teacherHeaders,
      payload: { sectionId: 'sec-grade10a-001' },
    });
    expect(assignRes.statusCode, assignRes.payload).toBe(201);
    const caa = JSON.parse(assignRes.payload) as { id: string };
    createdCaaIds.push(caa.id);

    // Student1A starts assigned attempt, answers MCQ with Option Alpha (snapshot-correct), skips SHORT_ANSWER on submit
    const startAttempt = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${caa.id}/attempts`,
      headers: stu1Headers,
      payload: {},
    });
    expect(startAttempt.statusCode, startAttempt.payload).toBe(200);
    const attemptBody = JSON.parse(startAttempt.payload) as { attemptId: string };
    createdAttemptIds.push(attemptBody.attemptId);

    const saveMcq = await app.inject({
      method: 'PUT',
      url: `/api/learning/attempts/${attemptBody.attemptId}/answers/${qMcqId}`,
      headers: stu1Headers,
      payload: { response: optAId },
    });
    expect(saveMcq.statusCode).toBe(200);

    const submitRes = await app.inject({
      method: 'POST',
      url: `/api/learning/attempts/${attemptBody.attemptId}/submit`,
      headers: stu1Headers,
      payload: { answers: {} },
    });
    expect(submitRes.statusCode).toBe(200);
    expect(JSON.parse(submitRes.payload).status).toBe('PENDING_REVIEW');

    // Teacher2A shares student1A via secOtherId, but MUST NOT see or review/release sec-grade10a-001 attempts
    const t2ReviewsRes = await app.inject({
      method: 'GET',
      url: '/api/teacher/assessment-reviews',
      headers: teacher2Headers,
    });
    expect(t2ReviewsRes.statusCode).toBe(200);
    const t2Reviews = JSON.parse(t2ReviewsRes.payload) as Array<{ attemptId: string }>;
    expect(t2Reviews.some((r) => r.attemptId === attemptBody.attemptId)).toBe(false);

    // TeacherA MUST see a PENDING_REVIEW queue item for the skipped SHORT_ANSWER
    const t1ReviewsRes = await app.inject({
      method: 'GET',
      url: '/api/teacher/assessment-reviews',
      headers: teacherHeaders,
    });
    expect(t1ReviewsRes.statusCode).toBe(200);
    const t1Reviews = JSON.parse(t1ReviewsRes.payload) as Array<{
      attemptId: string;
      answerId: string;
      questionId: string;
      response: unknown;
    }>;
    const skippedItem = t1Reviews.find(
      (r) => r.attemptId === attemptBody.attemptId && r.questionId === qShortId,
    );
    expect(skippedItem).toBeTruthy();

    const t2ReviewAttempt = await app.inject({
      method: 'POST',
      url: `/api/teacher/assessment-answers/${skippedItem!.answerId}/review`,
      headers: teacher2Headers,
      payload: { marksAwarded: 0, feedback: 'Unauthorized' },
    });
    expect(t2ReviewAttempt.statusCode).toBe(403);

    const t1ReviewAttempt = await app.inject({
      method: 'POST',
      url: `/api/teacher/assessment-answers/${skippedItem!.answerId}/review`,
      headers: teacherHeaders,
      payload: { marksAwarded: 0, feedback: 'Question left unanswered' },
    });
    expect(t1ReviewAttempt.statusCode).toBe(200);
    expect(JSON.parse(t1ReviewAttempt.payload).reviewed).toBe(true);

    const t2ReleaseAttempt = await app.inject({
      method: 'POST',
      url: `/api/teacher/assessment-attempts/${attemptBody.attemptId}/release`,
      headers: teacher2Headers,
      payload: {},
    });
    expect(t2ReleaseAttempt.statusCode).toBe(403);

    const t1ReleaseAttempt = await app.inject({
      method: 'POST',
      url: `/api/teacher/assessment-attempts/${attemptBody.attemptId}/release`,
      headers: teacherHeaders,
      payload: {},
    });
    expect(t1ReleaseAttempt.statusCode).toBe(200);
    expect(JSON.parse(t1ReleaseAttempt.payload).released).toBe(true);

    const stu1ResultsAfter = await app.inject({
      method: 'GET',
      url: '/api/learning/results',
      headers: stu1Headers,
    });
    expect(stu1ResultsAfter.statusCode).toBe(200);
    const releasedAttemptResult = (
      JSON.parse(stu1ResultsAfter.payload) as {
        items: Array<{
          attemptId: string;
          status: string;
          score: number | null;
          passed: boolean | null;
        }>;
      }
    ).items.find((r) => r.attemptId === attemptBody.attemptId);
    expect(releasedAttemptResult?.status).toBe('RELEASED');
    expect(releasedAttemptResult?.score).toBe(10); // 10 marks from snapshot-graded MCQ + 0 for skipped written
    expect(releasedAttemptResult?.passed).toBe(true);

    // Platform self-paced attempt vs section-assigned attempt of the same assessment must not collide
    const ownerHeaders = { authorization: `Bearer ${owner.accessToken}` };
    const createPlatAsmt = await app.inject({
      method: 'POST',
      url: '/api/assessments',
      headers: ownerHeaders,
      payload: {
        courseId: 'crs-ai-readiness-001',
        moduleId: 'mod-ai-01',
        title: `Platform Attempt Isolation ${runTag}`,
        scope: 'PLATFORM',
        status: 'PUBLISHED',
        attemptLimit: 1,
        passingMarks: 5,
        questionIds: [qPlatId],
      },
    });
    expect(createPlatAsmt.statusCode, createPlatAsmt.payload).toBe(201);
    const platAsmt = JSON.parse(createPlatAsmt.payload) as { id: string };
    createdAssessmentIds.push(platAsmt.id);

    const platStart = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${platAsmt.id}/attempts`,
      headers: stu2Headers,
      payload: {},
    });
    expect(platStart.statusCode, platStart.payload).toBe(200);
    const platAtt = JSON.parse(platStart.payload) as {
      attemptId: string;
      assignmentId: string | null;
    };
    createdAttemptIds.push(platAtt.attemptId);
    expect(platAtt.assignmentId).toBeNull();

    const platSubmit = await app.inject({
      method: 'POST',
      url: `/api/learning/attempts/${platAtt.attemptId}/submit`,
      headers: stu2Headers,
      payload: { answers: { [qPlatId]: optPlatAId } },
    });
    expect(platSubmit.statusCode).toBe(200);
    expect(JSON.parse(platSubmit.payload).status).toBe('RELEASED');

    // Second self-paced attempt hits attemptLimit=1 (409)
    const platBlocked = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${platAsmt.id}/attempts`,
      headers: stu2Headers,
      payload: {},
    });
    expect(platBlocked.statusCode).toBe(409);

    // Assigning same assessment to section gives a separate attempt context (attemptNumber=2, no unique-key collision)
    const platAssignRes = await app.inject({
      method: 'POST',
      url: `/api/assessments/${platAsmt.id}/assign`,
      headers: { authorization: `Bearer ${orgAdminA.accessToken}` },
      payload: { sectionId: 'sec-grade10a-001' },
    });
    expect(platAssignRes.statusCode, platAssignRes.payload).toBe(201);
    const platCaa = JSON.parse(platAssignRes.payload) as { id: string };
    createdCaaIds.push(platCaa.id);

    const assignedStart = await app.inject({
      method: 'POST',
      url: `/api/learning/assessments/${platCaa.id}/attempts`,
      headers: stu2Headers,
      payload: {},
    });
    expect(assignedStart.statusCode, assignedStart.payload).toBe(200);
    const assignedAtt = JSON.parse(assignedStart.payload) as {
      attemptId: string;
      assignmentId: string | null;
    };
    createdAttemptIds.push(assignedAtt.attemptId);
    expect(assignedAtt.attemptId).not.toBe(platAtt.attemptId);
    expect(assignedAtt.assignmentId).toBe(platCaa.id);

    const stu2Results = await app.inject({
      method: 'GET',
      url: '/api/learning/results',
      headers: stu2Headers,
    });
    expect(stu2Results.statusCode).toBe(200);
    const stu2Items = (
      JSON.parse(stu2Results.payload) as {
        items: Array<{
          attemptId: string;
          assignmentId: string | null;
          attemptNumber: number;
        }>;
      }
    ).items;
    expect(stu2Items.find((i) => i.attemptId === platAtt.attemptId)?.attemptNumber).toBe(1);
    expect(stu2Items.find((i) => i.attemptId === assignedAtt.attemptId)?.attemptNumber).toBe(2);
  });
});
