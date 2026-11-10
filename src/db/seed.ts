import argon2 from 'argon2';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgresql://lplatform:lplatform_dev@localhost:5432/lplatform';

export async function seedDatabase() {
  const pool = new Pool({ connectionString });

  try {
    console.log('Seeding development database...');

    // 1. Create Organization: Riverside Public School
    const orgId = 'org-riverside-001';
    await pool.query(
      `INSERT INTO organizations (id, name, slug, description, status, contact_email, contact_phone, address, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [
        orgId,
        'Riverside Public School',
        'riverside-public-school',
        'Demonstration K-12 school for computer science curriculum.',
        'ACTIVE',
        'contact@riverside.edu',
        '+1-555-0199',
        '100 River Road, Springfield',
        JSON.stringify({ maxStudents: 500, features: ['python', 'java', 'cpp'] }),
      ],
    );

    // 2. Passwords with Argon2id
    const adminPassHash = await argon2.hash('Admin@123');
    const orgAdminPassHash = await argon2.hash('OrgAdmin@123');
    const teacherPassHash = await argon2.hash('Teacher@123');
    const studentPassHash = await argon2.hash('Student@123');

    // 3. Platform Admin
    const adminId = 'usr-admin-001';
    await pool.query(
      `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [adminId, 'Platform', 'Administrator', 'admin@lplatform.dev', 'PLATFORM_ADMIN', 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [adminId, adminPassHash],
    );

    // 4. Organization Admin (Priya Sharma)
    const orgAdminId = 'usr-orgadmin-001';
    await pool.query(
      `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [
        orgAdminId,
        orgId,
        'Priya',
        'Sharma',
        'priya.sharma@riverside.edu',
        'ORGANIZATION_ADMIN',
        'ACTIVE',
      ],
    );
    await pool.query(
      `INSERT INTO credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [orgAdminId, orgAdminPassHash],
    );

    // 5. Teacher (Marcus Brody)
    const teacherId = 'usr-teacher-001';
    await pool.query(
      `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [teacherId, orgId, 'Marcus', 'Brody', 'teacher@riverside.edu', 'TEACHER', 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [teacherId, teacherPassHash],
    );

    // 6. Students (Alice Walker, Bob Smith)
    const student1Id = 'usr-student-001';
    await pool.query(
      `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [student1Id, orgId, 'Alice', 'Walker', 'student1@riverside.edu', 'STUDENT', 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [student1Id, studentPassHash],
    );

    const student2Id = 'usr-student-002';
    await pool.query(
      `INSERT INTO users (id, organization_id, first_name, last_name, email, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [student2Id, orgId, 'Bob', 'Smith', 'student2@riverside.edu', 'STUDENT', 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO credentials (user_id, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [student2Id, studentPassHash],
    );

    // 7. Academic Class: Grade 10
    const classId = 'cls-grade10-001';
    await pool.query(
      `INSERT INTO classes (id, organization_id, name, grade, academic_year, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [classId, orgId, 'Grade 10', '10', '2026-2027', 'Sophomore secondary cohort', 'ACTIVE'],
    );

    // 8. Sections: Section A & Section B
    const secAId = 'sec-grade10a-001';
    await pool.query(
      `INSERT INTO sections (id, class_id, name, max_students, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [secAId, classId, 'Section A', 35, 'ACTIVE'],
    );

    const secBId = 'sec-grade10b-002';
    await pool.query(
      `INSERT INTO sections (id, class_id, name, max_students, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [secBId, classId, 'Section B', 35, 'ACTIVE'],
    );

    // 9. Memberships:
    // Teacher assigned to Section A & B
    await pool.query(
      `INSERT INTO teacher_section_memberships (id, teacher_id, section_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ['tsm-teacher-secA', teacherId, secAId, 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO teacher_section_memberships (id, teacher_id, section_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ['tsm-teacher-secB', teacherId, secBId, 'ACTIVE'],
    );

    // Student 1 & 2 in Section A
    await pool.query(
      `INSERT INTO student_section_memberships (id, student_id, section_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ['ssm-student1-secA', student1Id, secAId, 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO student_section_memberships (id, student_id, section_id, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      ['ssm-student2-secA', student2Id, secAId, 'ACTIVE'],
    );

    // 10. Course: Introduction to Programming in Python
    const courseId = 'crs-python-001';
    await pool.query(
      `INSERT INTO courses (id, organization_id, title, description, language, difficulty, status, version, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        courseId,
        orgId,
        'Introduction to Programming in Python',
        'Foundational programming concepts covering variables, loops, conditionals, and functions.',
        'PYTHON',
        'BEGINNER',
        'PUBLISHED',
        '1.0.0',
        teacherId,
      ],
    );

    // 11. Course Allocation to Section A
    const allocId = 'alloc-py-secA-001';
    await pool.query(
      `INSERT INTO course_allocations (id, course_id, section_id, teacher_id, status, start_date)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [allocId, courseId, secAId, teacherId, 'ACTIVE'],
    );

    // 12. Questions:
    // Question 1: Sum of Two Numbers
    const q1Id = 'qst-sum-001';
    await pool.query(
      `INSERT INTO questions (id, organization_id, course_id, created_by, title, description, input_format, output_format, constraints, examples, explanation, difficulty, topic, supported_languages, marks, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        q1Id,
        orgId,
        courseId,
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
        'EASY',
        'Basic Arithmetic',
        JSON.stringify(['PYTHON', 'JAVA', 'CPP']),
        10,
        'PUBLISHED',
      ],
    );

    // Test cases for Question 1 (2 Sample, 2 Hidden)
    await pool.query(
      `INSERT INTO test_cases (id, question_id, input, expected_output, is_hidden, is_sample, order_num)
       VALUES 
         ('tc-sum-s1', $1, '3 5\n', '8\n', false, true, 1),
         ('tc-sum-s2', $1, '-2 10\n', '8\n', false, true, 2),
         ('tc-sum-h1', $1, '1000000 2000000\n', '3000000\n', true, false, 3),
         ('tc-sum-h2', $1, '0 0\n', '0\n', true, false, 4)
       ON CONFLICT (id) DO NOTHING`,
      [q1Id],
    );

    // Question 2: Find Maximum in List
    const q2Id = 'qst-max-002';
    await pool.query(
      `INSERT INTO questions (id, organization_id, course_id, created_by, title, description, input_format, output_format, constraints, examples, explanation, difficulty, topic, supported_languages, marks, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (id) DO NOTHING`,
      [
        q2Id,
        orgId,
        courseId,
        teacherId,
        'Find the Maximum Element',
        'Given N integers, find and print the maximum value among them.',
        'Line 1: An integer N. Line 2: N space-separated integers.',
        'A single integer: the maximum value.',
        '1 <= N <= 10^5, -10^9 <= element <= 10^9',
        JSON.stringify([{ input: '5\n1 9 3 7 5', output: '9' }]),
        'Iterate through the array and track the largest value seen.',
        'EASY',
        'Arrays',
        JSON.stringify(['PYTHON', 'JAVA', 'CPP']),
        10,
        'PUBLISHED',
      ],
    );

    await pool.query(
      `INSERT INTO test_cases (id, question_id, input, expected_output, is_hidden, is_sample, order_num)
       VALUES 
         ('tc-max-s1', $1, '5\n1 9 3 7 5\n', '9\n', false, true, 1),
         ('tc-max-h1', $1, '3\n-10 -5 -20\n', '-5\n', true, false, 2)
       ON CONFLICT (id) DO NOTHING`,
      [q2Id],
    );

    // 13. Assignment: Homework 1 - Python Basics
    const asgId = 'asg-python-hw1';
    await pool.query(
      `INSERT INTO assignments (id, organization_id, section_id, course_allocation_id, created_by, title, description, instructions, total_marks, start_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        asgId,
        orgId,
        secAId,
        allocId,
        teacherId,
        'Homework 1 — Python Basics',
        'Introductory problem set covering fundamental arithmetic and data structures.',
        'Read problem constraints carefully. Ensure your solution passes all sample test cases before final submission.',
        20,
        'PUBLISHED',
      ],
    );

    // Link Questions to Assignment
    await pool.query(
      `INSERT INTO assignment_questions (id, assignment_id, question_id, marks, order_num)
       VALUES 
         ('aq-asg1-q1', $1, $2, 10, 1),
         ('aq-asg1-q2', $1, $3, 10, 2)
       ON CONFLICT (id) DO NOTHING`,
      [asgId, q1Id, q2Id],
    );

    // 14. Platform Settings
    await pool.query(
      `INSERT INTO platform_settings (id, platform_name, support_email, session_timeout_minutes, max_file_upload_mb, maintenance_mode)
       VALUES ('default', 'L_Platform', 'support@lplatform.dev', 1440, 10, false)
       ON CONFLICT (id) DO NOTHING`,
    );

    console.log('Database seeded successfully!');
    console.log('Seed Accounts:');
    console.log('  Platform Admin : admin@lplatform.dev / Admin@123');
    console.log('  Org Admin      : priya.sharma@riverside.edu / OrgAdmin@123');
    console.log('  Teacher        : teacher@riverside.edu / Teacher@123');
    console.log('  Student 1      : student1@riverside.edu / Student@123');
    console.log('  Student 2      : student2@riverside.edu / Student@123');
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
