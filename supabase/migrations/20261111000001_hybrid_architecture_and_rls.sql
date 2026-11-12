-- L_Platform Hybrid Architecture: Supabase PostgreSQL Student Activity & Identity RLS
-- Identity: Supabase Auth (auth.uid())
-- Role hierarchy in JWT app_metadata.role / public.profiles.role:
--   PLATFORM_OWNER, PLATFORM_DEVELOPER, ORGANIZATION_ADMIN, TEACHER, STUDENT
--
-- Security Invariants:
-- 1. PLATFORM_DEVELOPER MUST NOT access student PII, organizations, attempts, submissions, reviews, or results.
-- 2. ORGANIZATION_ADMIN controls records scoped to their own organization_id.
-- 3. TEACHER accesses assigned sections and enrolled student records only.
-- 4. STUDENT accesses only own records and eligible published/free courses.
-- 5. Teacher-authored curriculum & immutable published questions live in OCI PostgreSQL;
--    private teacher files live in private OCI Object Storage and are retrieved via Edge Functions.

CREATE SCHEMA IF NOT EXISTS lplatform;

CREATE TABLE IF NOT EXISTS lplatform.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id text,
  role text NOT NULL CHECK (
    role IN ('PLATFORM_OWNER', 'PLATFORM_DEVELOPER', 'ORGANIZATION_ADMIN', 'TEACHER', 'STUDENT')
  ),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lplatform.section_memberships (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  section_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES lplatform.profiles(user_id) ON DELETE CASCADE,
  member_role text NOT NULL CHECK (member_role IN ('TEACHER', 'STUDENT')),
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, user_id, member_role)
);

CREATE TABLE IF NOT EXISTS lplatform.lesson_progress (
  id text PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES lplatform.profiles(user_id) ON DELETE CASCADE,
  organization_id text,
  course_id text NOT NULL,
  module_id text NOT NULL,
  lesson_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS lplatform.assessment_attempts (
  id text PRIMARY KEY,
  assessment_id text NOT NULL,
  assignment_id text,
  student_id uuid NOT NULL REFERENCES lplatform.profiles(user_id) ON DELETE RESTRICT,
  organization_id text,
  assessment_version integer NOT NULL,
  attempt_number integer NOT NULL,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  score integer,
  total_marks integer NOT NULL,
  passed boolean,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  released_at timestamptz,
  grader_id uuid REFERENCES lplatform.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lplatform.submissions (
  id text PRIMARY KEY,
  assignment_id text NOT NULL,
  question_id text NOT NULL,
  student_id uuid NOT NULL REFERENCES lplatform.profiles(user_id) ON DELETE RESTRICT,
  organization_id text NOT NULL,
  section_id text NOT NULL,
  language text NOT NULL,
  code text,
  written_response text,
  response_payload jsonb,
  attachment_object_key text,
  status text NOT NULL DEFAULT 'PENDING_REVIEW',
  score integer,
  teacher_feedback text,
  feedback_released_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- SECURITY DEFINER claim helpers avoid recursive policy lookups
CREATE OR REPLACE FUNCTION lplatform.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = lplatform, auth, pg_temp
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    (SELECT p.role FROM lplatform.profiles p WHERE p.user_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION lplatform.current_org_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = lplatform, auth, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((auth.jwt() -> 'app_metadata' ->> 'organization_id'), ''),
    (SELECT p.organization_id FROM lplatform.profiles p WHERE p.user_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION lplatform.teacher_teaches_section(target_section_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = lplatform, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM lplatform.section_memberships sm
    WHERE sm.section_id = target_section_id
      AND sm.user_id = auth.uid()
      AND sm.member_role = 'TEACHER'
      AND sm.status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION lplatform.teacher_has_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = lplatform, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM lplatform.section_memberships tm
    JOIN lplatform.section_memberships sm
      ON sm.section_id = tm.section_id
    WHERE tm.user_id = auth.uid()
      AND tm.member_role = 'TEACHER'
      AND tm.status = 'ACTIVE'
      AND sm.user_id = target_student_id
      AND sm.member_role = 'STUDENT'
      AND sm.status = 'ACTIVE'
  );
$$;

ALTER TABLE lplatform.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lplatform.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE lplatform.section_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE lplatform.section_memberships FORCE ROW LEVEL SECURITY;

ALTER TABLE lplatform.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lplatform.lesson_progress FORCE ROW LEVEL SECURITY;

ALTER TABLE lplatform.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lplatform.assessment_attempts FORCE ROW LEVEL SECURITY;

ALTER TABLE lplatform.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lplatform.submissions FORCE ROW LEVEL SECURITY;

-- Profiles: PLATFORM_DEVELOPER explicitly restricted to own profile row only (no student PII)
CREATE POLICY profiles_select_policy ON lplatform.profiles
  FOR SELECT
  USING (
    lplatform.current_role() = 'PLATFORM_OWNER'
    OR user_id = auth.uid()
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id IS NOT NULL
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND lplatform.teacher_has_student(user_id)
    )
  );

-- Lesson Progress: student owns their progress; OrgAdmin/Owner/assigned teacher can read scoped rows
CREATE POLICY lesson_progress_student_all ON lplatform.lesson_progress
  FOR ALL
  USING (
    student_id = auth.uid()
    OR lplatform.current_role() = 'PLATFORM_OWNER'
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND lplatform.teacher_has_student(student_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    OR lplatform.current_role() = 'PLATFORM_OWNER'
  );

-- Assessment Attempts: zero access for PLATFORM_DEVELOPER; student own rows; teacher assigned students
CREATE POLICY attempts_select_policy ON lplatform.assessment_attempts
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR lplatform.current_role() = 'PLATFORM_OWNER'
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND organization_id = lplatform.current_org_id()
      AND lplatform.teacher_has_student(student_id)
    )
  );

CREATE POLICY attempts_insert_student ON lplatform.assessment_attempts
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY attempts_update_scoped ON lplatform.assessment_attempts
  FOR UPDATE
  USING (
    student_id = auth.uid()
    OR lplatform.current_role() = 'PLATFORM_OWNER'
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND organization_id = lplatform.current_org_id()
      AND lplatform.teacher_has_student(student_id)
    )
  );

-- Submissions: zero access for PLATFORM_DEVELOPER; students own rows; teachers grade section submissions
CREATE POLICY submissions_select_policy ON lplatform.submissions
  FOR SELECT
  USING (
    student_id = auth.uid()
    OR lplatform.current_role() = 'PLATFORM_OWNER'
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND organization_id = lplatform.current_org_id()
      AND lplatform.teacher_teaches_section(section_id)
    )
  );

CREATE POLICY submissions_insert_student ON lplatform.submissions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY submissions_update_teacher ON lplatform.submissions
  FOR UPDATE
  USING (
    lplatform.current_role() = 'PLATFORM_OWNER'
    OR (
      lplatform.current_role() = 'ORGANIZATION_ADMIN'
      AND organization_id = lplatform.current_org_id()
    )
    OR (
      lplatform.current_role() = 'TEACHER'
      AND organization_id = lplatform.current_org_id()
      AND lplatform.teacher_teaches_section(section_id)
    )
  );

