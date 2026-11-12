import '../load-env.js';
import argon2 from 'argon2';
import pg from 'pg';
import { aiReadinessCourse } from '../content/ai-readiness.js';
import {
  aiReadinessAssessments,
  allSeedQuestions,
  buildQuestionAnswerKey,
  validateQuestionBank,
} from '../content/bank/index.js';
import { getDatabaseUrl } from '../lib/env.js';

const { Pool } = pg;

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run demo database seeder in production without explicit ALLOW_PROD_SEED=true.',
    );
  }

  const bankCheck = validateQuestionBank();
  if (!bankCheck.valid) {
    throw new Error(`Invalid question bank seed state: ${bankCheck.errors.join('; ')}`);
  }

  const forcePasswords = process.env.FORCE_RESEED_PASSWORDS === 'true';
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const client = await pool.connect();

  try {
    console.log('Seeding development database safely...');
    await client.query('BEGIN');

    // 1. Create Organization: Riverside Public School
    const orgId = 'org-riverside-001';
    await client.query(
      `INSERT INTO organizations (id, name, slug, description, status, contact_email, contact_phone, address, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [
        orgId,
        'Riverside Public School',
        'riverside-public-school',
        'Demonstration K-12 school for computer science and AI literacy curriculum.',
        'ACTIVE',
        'contact@riverside.edu',
        '+1-555-0199',
        '100 River Road, Springfield',
        JSON.stringify({ maxStudents: 500, features: ['python', 'java', 'cpp', 'ai-readiness'] }),
      ],
    );

    // 2. Hash development passwords with Argon2id (never overwritten if credentials already exist unless forced)
    const ownerPassHash = await argon2.hash('Admin@123');
    const devPassHash = await argon2.hash('Dev@123');
    const orgAdminPassHash = await argon2.hash('OrgAdmin@123');
    const teacherPassHash = await argon2.hash('Teacher@123');
    const studentPassHash = await argon2.hash('Student@123');

    const upsertUser = async (
      id: string,
      organizationId: string | null,
      firstName: string,
      lastName: string,
      email: string,
      role: string,
      passwordHash: string,
    ) => {
      await client.query(
        `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name`,
        [id, organizationId, firstName, lastName, email, role],
      );
      if (forcePasswords) {
        await client.query(
          `INSERT INTO credentials (user_id, password_hash)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
          [id, passwordHash],
        );
      } else {
        await client.query(
          `INSERT INTO credentials (user_id, password_hash)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO NOTHING`,
          [id, passwordHash],
        );
      }
    };

    // 3. Seed Role Accounts (5 roles + independent platform learner)
    const ownerId = 'usr-admin-001';
    await upsertUser(
      ownerId,
      null,
      'Platform',
      'Owner',
      'admin@lplatform.dev',
      'PLATFORM_OWNER',
      ownerPassHash,
    );

    const devId = 'usr-dev-001';
    await upsertUser(
      devId,
      null,
      'Platform',
      'Developer',
      'developer@lplatform.dev',
      'PLATFORM_DEVELOPER',
      devPassHash,
    );

    const orgAdminId = 'usr-orgadmin-001';
    await upsertUser(
      orgAdminId,
      orgId,
      'Priya',
      'Sharma',
      'priya.sharma@riverside.edu',
      'ORGANIZATION_ADMIN',
      orgAdminPassHash,
    );

    const teacherId = 'usr-teacher-001';
    await upsertUser(
      teacherId,
      orgId,
      'Marcus',
      'Brody',
      'teacher@riverside.edu',
      'TEACHER',
      teacherPassHash,
    );

    const student1Id = 'usr-student-001';
    await upsertUser(
      student1Id,
      orgId,
      'Alice',
      'Walker',
      'student1@riverside.edu',
      'STUDENT',
      studentPassHash,
    );

    const student2Id = 'usr-student-002';
    await upsertUser(
      student2Id,
      orgId,
      'Bob',
      'Smith',
      'student2@riverside.edu',
      'STUDENT',
      studentPassHash,
    );

    const independentLearnerId = 'usr-learner-001';
    await upsertUser(
      independentLearnerId,
      null,
      'Asha',
      'Verma',
      'learner@lplatform.dev',
      'STUDENT',
      studentPassHash,
    );

    // 4. Academic Class & Sections
    const classId = 'cls-grade10-001';
    await client.query(
      `INSERT INTO classes (id, organization_id, name, grade, academic_year, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [classId, orgId, 'Grade 10', '10', '2026-2027', 'Sophomore secondary cohort'],
    );

    const secAId = 'sec-grade10a-001';
    await client.query(
      `INSERT INTO sections (id, class_id, name, max_students, status)
       VALUES ($1, $2, $3, 35, 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [secAId, classId, 'Section A'],
    );

    const secBId = 'sec-grade10b-002';
    await client.query(
      `INSERT INTO sections (id, class_id, name, max_students, status)
       VALUES ($1, $2, $3, 35, 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [secBId, classId, 'Section B'],
    );

    // 5. Memberships
    await client.query(
      `INSERT INTO teacher_section_memberships (id, teacher_id, section_id, status)
       VALUES ($1, $2, $3, 'ACTIVE'), ($4, $2, $5, 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      ['tsm-teacher-secA', teacherId, secAId, 'tsm-teacher-secB', secBId],
    );

    await client.query(
      `INSERT INTO student_section_memberships (id, student_id, section_id, status)
       VALUES ('ssm-student1-secA', $1, $3, 'ACTIVE'), ('ssm-student2-secA', $2, $3, 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [student1Id, student2Id, secAId],
    );

    // 6. Platform-Wide Free AI Readiness Course (NOT org-allocated!)
    const aiCourseId = 'crs-ai-readiness-001';
    await client.query(
      `INSERT INTO courses (id, organization_id, created_by, title, description, category, language, difficulty, is_platform_course, access_model, estimated_minutes, status, version)
       VALUES ($1, NULL, $2, $3, $4, $5, 'AI_CONCEPTS', 'BEGINNER', true, 'PLATFORM_FREE', $6, 'PUBLISHED', '1.0.0')
       ON CONFLICT (id) DO UPDATE SET
         organization_id = NULL,
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         category = EXCLUDED.category,
         is_platform_course = true,
         access_model = 'PLATFORM_FREE',
         estimated_minutes = EXCLUDED.estimated_minutes,
         status = 'PUBLISHED',
         updated_at = NOW()`,
      [
        aiCourseId,
        ownerId,
        aiReadinessCourse.title,
        aiReadinessCourse.description,
        'Artificial Intelligence',
        aiReadinessCourse.estimatedMinutes,
      ],
    );

    // 7. School Python Course + Section A Allocation
    const pythonCourseId = 'crs-python-001';
    await client.query(
      `INSERT INTO courses (id, organization_id, created_by, title, description, category, language, difficulty, is_platform_course, access_model, estimated_minutes, status, version)
       VALUES ($1, $2, $3, $4, $5, 'Programming', 'PYTHON', 'BEGINNER', false, 'ORGANIZATION_ONLY', 480, 'PUBLISHED', '1.0.0')
       ON CONFLICT (id) DO UPDATE SET
         is_platform_course = false,
         access_model = 'ORGANIZATION_ONLY',
         estimated_minutes = 480`,
      [
        pythonCourseId,
        orgId,
        teacherId,
        'Introduction to Programming in Python',
        'Foundational programming concepts covering variables, conditionals, loops, collections, functions, searching and sorting.',
      ],
    );

    const allocId = 'alloc-py-secA-001';
    await client.query(
      `INSERT INTO course_allocations (id, course_id, organization_id, class_id, section_id, scope, teacher_id, status, access_enabled, start_date)
       VALUES ($1, $2, $3, $4, $5, 'SECTION', $6, 'ACTIVE', true, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [allocId, pythonCourseId, orgId, classId, secAId, teacherId],
    );

    // 8. Legacy Seed Questions (preserve existing IDs)
    const q1Id = 'qst-sum-001';
    await client.query(
      `INSERT INTO questions (id, organization_id, course_id, created_by, title, description, input_format, output_format, constraints, examples, explanation, difficulty, topic, supported_languages, marks, question_type, estimated_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'EASY', 'Basic Arithmetic', $12, 10, 'CODE', 8, 'PUBLISHED')
       ON CONFLICT (id) DO NOTHING`,
      [
        q1Id,
        orgId,
        pythonCourseId,
        teacherId,
        'Sum of Two Integers',
        'Write a program that reads two space-separated integers from standard input and prints their sum.',
        'Two space-separated integers A and B on a single line.',
        'A single integer representing A + B.',
        '-10^9 <= A, B <= 10^9',
        JSON.stringify([
          { input: '3 5', output: '8' },
          { input: '-2 10', output: '8' },
        ]),
        'Calculate A + B and output the result.',
        JSON.stringify(['PYTHON', 'JAVA', 'CPP']),
      ],
    );
    await client.query(
      `INSERT INTO test_cases (id, question_id, input, expected_output, is_hidden, is_sample, order_num)
       VALUES
         ('tc-sum-s1', $1, '3 5\n', '8\n', false, true, 1),
         ('tc-sum-s2', $1, '-2 10\n', '8\n', false, true, 2),
         ('tc-sum-h1', $1, '1000000 2000000\n', '3000000\n', true, false, 3),
         ('tc-sum-h2', $1, '0 0\n', '0\n', true, false, 4)
       ON CONFLICT (id) DO NOTHING`,
      [q1Id],
    );

    const q2Id = 'qst-max-002';
    await client.query(
      `INSERT INTO questions (id, organization_id, course_id, created_by, title, description, input_format, output_format, constraints, examples, explanation, difficulty, topic, supported_languages, marks, question_type, estimated_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'EASY', 'Arrays', $12, 10, 'CODE', 10, 'PUBLISHED')
       ON CONFLICT (id) DO NOTHING`,
      [
        q2Id,
        orgId,
        pythonCourseId,
        teacherId,
        'Find the Maximum Element',
        'Given N integers, find and print the maximum value among them.',
        'Line 1: An integer N. Line 2: N space-separated integers.',
        'A single integer: the maximum value.',
        '1 <= N <= 10^5, -10^9 <= element <= 10^9',
        JSON.stringify([{ input: '5\n1 9 3 7 5', output: '9' }]),
        'Iterate through the array and track the largest value seen.',
        JSON.stringify(['PYTHON', 'JAVA', 'CPP']),
      ],
    );
    await client.query(
      `INSERT INTO test_cases (id, question_id, input, expected_output, is_hidden, is_sample, order_num)
       VALUES
         ('tc-max-s1', $1, '5\n1 9 3 7 5\n', '9\n', false, true, 1),
         ('tc-max-h1', $1, '3\n-10 -5 -20\n', '-5\n', true, false, 2)
       ON CONFLICT (id) DO NOTHING`,
      [q2Id],
    );

    // 9. Upsert All 352 AI Readiness Questions + 24 Starter Programming + 3 Assignment Templates
    const questionLookup = new Map(allSeedQuestions.map((q) => [q.id, q]));

    for (const q of allSeedQuestions) {
      const answerKey = buildQuestionAnswerKey(q);
      const isPlatformQuestion = q.courseId === aiCourseId;
      await client.query(
        `INSERT INTO questions (
           id, organization_id, course_id, created_by, title, description,
           input_format, output_format, constraints, examples, explanation,
           difficulty, topic, supported_languages, marks, question_type,
           course_module_id, lesson_id, learning_objective, source_page, source_reference,
           answer_key, rubric, estimated_minutes, status
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11,
           $12, $13, $14, $15, $16,
           $17, $18, $19, $20, $21,
           $22, $23, $24, 'PUBLISHED'
         )
         ON CONFLICT (id) DO UPDATE SET
           organization_id = EXCLUDED.organization_id,
           course_id = EXCLUDED.course_id,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           input_format = EXCLUDED.input_format,
           output_format = EXCLUDED.output_format,
           constraints = EXCLUDED.constraints,
           examples = EXCLUDED.examples,
           explanation = EXCLUDED.explanation,
           difficulty = EXCLUDED.difficulty,
           topic = EXCLUDED.topic,
           supported_languages = EXCLUDED.supported_languages,
           marks = EXCLUDED.marks,
           question_type = EXCLUDED.question_type,
           course_module_id = EXCLUDED.course_module_id,
           lesson_id = EXCLUDED.lesson_id,
           learning_objective = EXCLUDED.learning_objective,
           source_page = EXCLUDED.source_page,
           source_reference = EXCLUDED.source_reference,
           answer_key = EXCLUDED.answer_key,
           rubric = EXCLUDED.rubric,
           estimated_minutes = EXCLUDED.estimated_minutes,
           status = 'PUBLISHED',
           updated_at = NOW()`,
        [
          q.id,
          isPlatformQuestion ? null : null, // Starter library is also platform-wide readable across orgs!
          q.courseId,
          ownerId,
          q.title,
          q.description,
          q.inputFormat ?? null,
          q.outputFormat ?? null,
          q.constraints ?? null,
          JSON.stringify(q.examples ?? []),
          q.explanation,
          q.difficulty,
          q.topic,
          JSON.stringify(q.supportedLanguages ?? ['PYTHON']),
          q.marks,
          q.questionType,
          q.courseModuleId,
          q.lessonId ?? null,
          q.learningObjective,
          q.sourcePage,
          q.sourceReference,
          JSON.stringify(answerKey),
          q.rubric ? JSON.stringify(q.rubric) : null,
          q.estimatedMinutes,
        ],
      );

      if (q.options && q.options.length > 0) {
        for (let idx = 0; idx < q.options.length; idx++) {
          const opt = q.options[idx];
          await client.query(
            `INSERT INTO question_options (id, question_id, option_text, order_num, is_correct)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               option_text = EXCLUDED.option_text,
               order_num = EXCLUDED.order_num,
               is_correct = EXCLUDED.is_correct`,
            [opt.id, q.id, opt.text, idx + 1, opt.isCorrect],
          );
        }
      }

      if (q.testCases && q.testCases.length > 0) {
        for (let idx = 0; idx < q.testCases.length; idx++) {
          const tc = q.testCases[idx];
          const tcId = `tc-${q.id}-${idx + 1}`;
          await client.query(
            `INSERT INTO test_cases (id, question_id, input, expected_output, is_hidden, is_sample, order_num)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               input = EXCLUDED.input,
               expected_output = EXCLUDED.expected_output,
               is_hidden = EXCLUDED.is_hidden,
               is_sample = EXCLUDED.is_sample,
               order_num = EXCLUDED.order_num`,
            [tcId, q.id, tc.input, tc.expectedOutput, tc.isHidden, tc.isSample, idx + 1],
          );
        }
      }
    }

    // 10. Seed 8 Platform-Wide AI Readiness Module Assessments (scope='PLATFORM', organization_id=NULL)
    for (const asmt of aiReadinessAssessments) {
      const totalMarks = asmt.questionIds.reduce(
        (sum, qId) => sum + (questionLookup.get(qId)?.marks ?? 1),
        0,
      );
      const passingMarks = Math.ceil((totalMarks * asmt.passingPercentage) / 100);

      await client.query(
        `INSERT INTO course_assessments (
           id, course_id, organization_id, scope, module_id, version, title, instructions,
           status, total_marks, passing_marks, duration_minutes, attempt_limit,
           review_policy, result_release_policy, created_by, published_at
         )
         VALUES ($1, $2, NULL, 'PLATFORM', $3, 1, $4, $5, 'PUBLISHED', $6, $7, $8, 3, 'AFTER_RELEASE', 'TEACHER', $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           organization_id = NULL,
           scope = 'PLATFORM',
           title = EXCLUDED.title,
           instructions = EXCLUDED.instructions,
           status = 'PUBLISHED',
           total_marks = EXCLUDED.total_marks,
           passing_marks = EXCLUDED.passing_marks,
           duration_minutes = EXCLUDED.duration_minutes,
           published_at = COALESCE(course_assessments.published_at, NOW()),
           updated_at = NOW()`,
        [
          asmt.id,
          asmt.courseId,
          asmt.moduleId,
          asmt.title,
          asmt.instructions,
          totalMarks,
          passingMarks,
          asmt.durationMinutes,
          ownerId,
        ],
      );

      for (let i = 0; i < asmt.questionIds.length; i++) {
        const qId = asmt.questionIds[i];
        const q = questionLookup.get(qId)!;
        const snapshot = {
          id: q.id,
          title: q.title,
          description: q.description,
          questionType: q.questionType,
          topic: q.topic,
          difficulty: q.difficulty,
          marks: q.marks,
          estimatedMinutes: q.estimatedMinutes,
          sourcePage: q.sourcePage,
          sourceReference: q.sourceReference,
          explanation: q.explanation,
          answerKey: buildQuestionAnswerKey(q),
          rubric: q.rubric ?? null,
          options: (q.options ?? []).map((o, idx) => ({
            id: o.id,
            text: o.text,
            optionText: o.text,
            isCorrect: Boolean(o.isCorrect),
            orderNum: idx + 1,
          })),
        };
        await client.query(
          `INSERT INTO course_assessment_questions (id, assessment_id, question_id, marks, order_num, question_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (assessment_id, question_id) DO UPDATE SET
             marks = EXCLUDED.marks,
             order_num = EXCLUDED.order_num,
             question_snapshot = EXCLUDED.question_snapshot`,
          [`caq-${asmt.id}-${i + 1}`, asmt.id, q.id, q.marks, i + 1, JSON.stringify(snapshot)],
        );
      }
    }

    // 11. Assignments in Riverside Section A (Programming + Written Case Study)
    const asgId = 'asg-python-hw1';
    await client.query(
      `INSERT INTO assignments (id, organization_id, section_id, course_allocation_id, created_by, title, assignment_type, description, instructions, total_marks, start_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PROGRAMMING', $7, $8, 30, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'PUBLISHED')
       ON CONFLICT (id) DO NOTHING`,
      [
        asgId,
        orgId,
        secAId,
        allocId,
        teacherId,
        'Homework 1 — Python Basics',
        'Introductory problem set covering arithmetic, arrays, and unit conversion.',
        'Read problem constraints carefully and validate boundary inputs against the sample cases.',
      ],
    );

    await client.query(
      `INSERT INTO assignment_questions (id, assignment_id, question_id, marks, order_num)
       VALUES
         ('aq-asg1-q1', $1, $2, 10, 1),
         ('aq-asg1-q2', $1, $3, 10, 2),
         ('aq-asg1-q3', $1, 'qst-prog-01-temp-convert', 10, 3)
       ON CONFLICT (id) DO NOTHING`,
      [asgId, q1Id, q2Id],
    );

    const caseAsgId = 'asg-ai-ethics-case1';
    const caseQuestionId = 'qst-ai-m8-41-lc-facial-rec-law-enforcement';
    await client.query(
      `INSERT INTO assignments (id, organization_id, section_id, course_allocation_id, created_by, title, assignment_type, description, instructions, total_marks, start_date, due_date, status)
       VALUES ($1, $2, $3, NULL, $4, $5, 'CASE_STUDY', $6, $7, 5, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'PUBLISHED')
       ON CONFLICT (id) DO NOTHING`,
      [
        caseAsgId,
        orgId,
        secAId,
        teacherId,
        'Module 8 Ethics Case Reflection',
        'Written ethical analysis applying the Five Pillars of AI Ethics to public-sector facial recognition.',
        'Write a structured response covering Fairness, Privacy, Robustness and concrete policy safeguards.',
      ],
    );
    await client.query(
      `INSERT INTO assignment_questions (id, assignment_id, question_id, marks, order_num)
       VALUES ('aq-ai-ethics-q1', $1, $2, 5, 1)
       ON CONFLICT (id) DO NOTHING`,
      [caseAsgId, caseQuestionId],
    );

    // 12. Platform Settings
    await client.query(
      `INSERT INTO platform_settings (id, platform_name, support_email, session_timeout_minutes, max_file_upload_mb, maintenance_mode)
       VALUES ('default', 'L_Platform', 'support@lplatform.dev', 1440, 10, false)
       ON CONFLICT (id) DO NOTHING`,
    );

    await client.query('COMMIT');
    console.log(
      `Database seeded successfully (${bankCheck.totalAiReadinessQuestions} AI Readiness questions, ${bankCheck.starterProgrammingCount} starter programming tasks, ${bankCheck.assessmentCount} platform assessments).`,
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
