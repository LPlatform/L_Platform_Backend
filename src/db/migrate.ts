import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL || 'postgresql://lplatform:lplatform_dev@localhost:5432/lplatform';

const isClean = process.argv.includes('--clean');

const migrationSql = `
-- Drop if clean
${
  isClean
    ? `
DROP TABLE IF EXISTS submission_results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignment_questions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS course_assessment_reviews CASCADE;
DROP TABLE IF EXISTS course_assessment_answers CASCADE;
DROP TABLE IF EXISTS course_assessment_attempts CASCADE;
DROP TABLE IF EXISTS course_assessment_assignments CASCADE;
DROP TABLE IF EXISTS course_assessment_questions CASCADE;
DROP TABLE IF EXISTS course_assessments CASCADE;
DROP TABLE IF EXISTS course_lesson_progress CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS course_allocations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS teacher_section_memberships CASCADE;
DROP TABLE IF EXISTS student_section_memberships CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS refresh_sessions CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
`
    : ''
}

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'SCHOOL',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'SCHOOL';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name TEXT NOT NULL DEFAULT '';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT '';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT '';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT '';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_section_memberships (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS teacher_section_memberships (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT,
  language TEXT NOT NULL DEFAULT 'PYTHON',
  difficulty TEXT NOT NULL DEFAULT 'BEGINNER',
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  version TEXT NOT NULL DEFAULT '1.0.0',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS course_allocations (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'SECTION',
  teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  access_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  revoked_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE course_allocations ALTER COLUMN section_id DROP NOT NULL;
ALTER TABLE course_allocations ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE course_allocations ADD COLUMN IF NOT EXISTS class_id TEXT REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE course_allocations ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'SECTION';
ALTER TABLE course_allocations ADD COLUMN IF NOT EXISTS access_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE course_allocations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
UPDATE course_allocations a
SET class_id = s.class_id,
    organization_id = c.organization_id
FROM sections s
JOIN classes c ON c.id = s.class_id
WHERE a.section_id = s.id AND (a.class_id IS NULL OR a.organization_id IS NULL);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  constraints TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'EASY',
  topic TEXT NOT NULL DEFAULT 'General',
  supported_languages JSONB NOT NULL DEFAULT '["PYTHON", "JAVA", "CPP"]'::jsonb,
  marks INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  order_num INTEGER NOT NULL DEFAULT 0,
  time_limit_ms INTEGER NOT NULL DEFAULT 2000,
  memory_limit_mb INTEGER NOT NULL DEFAULT 128,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'CODE';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS course_module_id TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS lesson_id TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS learning_objective TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_page TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_key JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS rubric JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS negative_marks INTEGER NOT NULL DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS allow_partial_credit BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS course_assessments (
  id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'DRAFT',
  total_marks INTEGER NOT NULL DEFAULT 0, passing_marks INTEGER, duration_minutes INTEGER,
  attempt_limit INTEGER NOT NULL DEFAULT 1, available_from TIMESTAMPTZ, available_until TIMESTAMPTZ,
  randomize_questions BOOLEAN NOT NULL DEFAULT FALSE, randomize_options BOOLEAN NOT NULL DEFAULT FALSE,
  allow_late BOOLEAN NOT NULL DEFAULT FALSE, review_policy TEXT NOT NULL DEFAULT 'AFTER_RELEASE',
  result_release_policy TEXT NOT NULL DEFAULT 'TEACHER',
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT, published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_course_assessment_version ON course_assessments(course_id,module_id,title,version);
CREATE INDEX IF NOT EXISTS idx_course_assessments_course_module ON course_assessments(course_id,module_id);
CREATE TABLE IF NOT EXISTS course_assessment_questions (
  id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT, marks INTEGER NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0, question_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(assessment_id,question_id)
);
CREATE TABLE IF NOT EXISTS course_assessment_assignments (
  id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_at TIMESTAMPTZ, due_at TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(assessment_id,section_id)
);
CREATE INDEX IF NOT EXISTS idx_assessment_assignment_section ON course_assessment_assignments(section_id,status);
CREATE TABLE IF NOT EXISTS course_assessment_attempts (
  id TEXT PRIMARY KEY, assessment_id TEXT NOT NULL REFERENCES course_assessments(id) ON DELETE RESTRICT,
  assignment_id TEXT NOT NULL REFERENCES course_assessment_assignments(id) ON DELETE RESTRICT,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  assessment_version INTEGER NOT NULL, attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS', score INTEGER, total_marks INTEGER NOT NULL, passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), submitted_at TIMESTAMPTZ, graded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ, grader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assessment_id,student_id,attempt_number)
);
CREATE INDEX IF NOT EXISTS idx_assessment_attempt_student_org ON course_assessment_attempts(student_id,organization_id,status);
CREATE TABLE IF NOT EXISTS course_assessment_answers (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES course_assessment_attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  response JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'SAVED', marks_awarded INTEGER,
  feedback TEXT, answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id,question_id)
);
CREATE TABLE IF NOT EXISTS course_assessment_reviews (
  id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES course_assessment_attempts(id) ON DELETE RESTRICT,
  answer_id TEXT NOT NULL REFERENCES course_assessment_answers(id) ON DELETE RESTRICT,
  reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  criterion_marks JSONB NOT NULL DEFAULT '[]'::jsonb, marks_awarded INTEGER NOT NULL,
  feedback TEXT NOT NULL DEFAULT '', action TEXT NOT NULL DEFAULT 'FINAL', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS course_lesson_progress (
  id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  module_id TEXT NOT NULL, lesson_id TEXT NOT NULL, student_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(course_id,module_id,lesson_id,student_id)
);
CREATE INDEX IF NOT EXISTS idx_course_lesson_progress_org ON course_lesson_progress(organization_id,module_id);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  course_allocation_id TEXT REFERENCES course_allocations(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  total_marks INTEGER NOT NULL DEFAULT 100,
  start_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  marks INTEGER NOT NULL DEFAULT 10,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  score INTEGER DEFAULT 0,
  total_test_cases INTEGER DEFAULT 0,
  passed_test_cases INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submission_results (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  actual_output TEXT,
  execution_time_ms INTEGER,
  memory_used_kb INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'EMAIL',
  role TEXT NOT NULL DEFAULT 'STUDENT',
  status TEXT NOT NULL DEFAULT 'PENDING',
  token_hash TEXT NOT NULL UNIQUE,
  invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'EMAIL';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  platform_name TEXT NOT NULL DEFAULT 'L_Platform',
  support_email TEXT DEFAULT 'support@lplatform.dev',
  allowed_domains JSONB DEFAULT '["*"]'::jsonb,
  session_timeout_minutes INTEGER DEFAULT 1440,
  max_file_upload_mb INTEGER DEFAULT 10,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Indexes for performance & isolation
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_classes_org ON classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON sections(class_id);
CREATE INDEX IF NOT EXISTS idx_student_memberships_student ON student_section_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_student_memberships_section ON student_section_memberships(section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_memberships_teacher ON teacher_section_memberships(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_memberships_section ON teacher_section_memberships(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_org ON questions(organization_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_question ON test_cases(question_id);
CREATE INDEX IF NOT EXISTS idx_assignments_section ON assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);

-- A single platform-wide course is shared; organization allocations grant inherited access.
INSERT INTO courses (id, organization_id, title, category, description, language, difficulty, status, version)
VALUES (
  'crs-ai-readiness-001', NULL, 'AI Readiness Course', 'Artificial Intelligence',
  'A practical introduction to AI, programming, data, machine learning, language technologies, projects and responsible AI.',
  'PYTHON', 'BEGINNER', 'PUBLISHED', '1.0.0'
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION allocate_ai_readiness_to_organization() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'ACTIVE' THEN
    INSERT INTO course_allocations (
      id, course_id, organization_id, scope, status, access_enabled, start_date
    )
    SELECT 'alloc-ai-readiness-org-' || substr(md5(NEW.id), 1, 12),
           'crs-ai-readiness-001', NEW.id, 'ORGANIZATION', 'ACTIVE', TRUE, NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM course_allocations
      WHERE course_id = 'crs-ai-readiness-001'
        AND organization_id = NEW.id
        AND scope = 'ORGANIZATION'
        AND status = 'ACTIVE'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_ai_readiness_allocation ON organizations;
CREATE TRIGGER organizations_ai_readiness_allocation
AFTER INSERT OR UPDATE OF status ON organizations
FOR EACH ROW EXECUTE FUNCTION allocate_ai_readiness_to_organization();

INSERT INTO course_allocations (
  id, course_id, organization_id, scope, status, access_enabled, start_date
)
SELECT 'alloc-ai-readiness-org-' || substr(md5(o.id), 1, 12),
       'crs-ai-readiness-001', o.id, 'ORGANIZATION', 'ACTIVE', TRUE, NOW()
FROM organizations o
WHERE o.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM course_allocations ca
    WHERE ca.course_id = 'crs-ai-readiness-001'
      AND ca.organization_id = o.id
      AND ca.scope = 'ORGANIZATION'
      AND ca.status = 'ACTIVE'
  )
ON CONFLICT (id) DO NOTHING;
`;

export async function runMigrations() {
  const pool = new Pool({ connectionString });
  try {
    console.log(`Running migrations against ${connectionString}... (clean=${isClean})`);
    await pool.query(migrationSql);
    console.log('Migrations completed successfully.');
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
