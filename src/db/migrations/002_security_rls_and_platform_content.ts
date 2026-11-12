import type pg from 'pg';

/**
 * Migration 002:
 * 1. Correct AI Readiness course access model (single platform-wide free course, no per-org triggers).
 * 2. Support platform-wide assessments without mandatory class/org enrollment + multi-type assignments.
 * 3. Provision least-privilege non-BYPASSRLS role `lplatform_app` and PostgreSQL Row-Level Security (RLS).
 */
export async function applySecurityRlsAndPlatformContentMigration(
  client: pg.PoolClient | pg.Pool,
): Promise<void> {
  // 1. Schema extensions (idempotent & non-destructive to preserve student progress/attempts)
  await client.query(`
    CREATE TABLE IF NOT EXISTS question_options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      option_text TEXT NOT NULL,
      order_num INTEGER NOT NULL DEFAULT 0,
      is_correct BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

    ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_platform_course BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS access_model TEXT NOT NULL DEFAULT 'ORG_ALLOCATED';
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 0;

    ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_reference TEXT;

    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type TEXT NOT NULL DEFAULT 'PROGRAMMING';
    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS attachment_instructions TEXT;
    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;
    ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_resubmit BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE submissions ALTER COLUMN code SET DEFAULT '';
    ALTER TABLE submissions ALTER COLUMN language SET DEFAULT 'PYTHON';
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS text_response TEXT;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attachment_url TEXT;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attachment_name TEXT;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attachment_mime TEXT;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS attachment_size_bytes INTEGER;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by TEXT REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback_released_at TIMESTAMPTZ;

    ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE;
    ALTER TABLE course_assessments ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'SECTION';

    ALTER TABLE course_assessment_attempts ALTER COLUMN assignment_id DROP NOT NULL;
    ALTER TABLE course_assessment_attempts ALTER COLUMN organization_id DROP NOT NULL;

    ALTER TABLE course_lesson_progress ALTER COLUMN organization_id DROP NOT NULL;
  `);

  // 2. Remove legacy per-organization allocation trigger so platform courses are never duplicated per org
  await client.query(`
    DROP TRIGGER IF EXISTS organizations_ai_readiness_allocation ON organizations;
    DROP FUNCTION IF EXISTS allocate_ai_readiness_to_organization();

    UPDATE courses
    SET organization_id = NULL,
        is_platform_course = true,
        access_model = 'PLATFORM_FREE',
        status = 'PUBLISHED',
        estimated_minutes = 600,
        updated_at = NOW()
    WHERE id = 'crs-ai-readiness-001';

    DELETE FROM course_allocations
    WHERE course_id = 'crs-ai-readiness-001'
      AND id LIKE 'alloc-ai-readiness-org-%';
  `);

  // 3. Provision least-privilege non-superuser / NOBYPASSRLS runtime role
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lplatform_app') THEN
        CREATE ROLE lplatform_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      ELSE
        ALTER ROLE lplatform_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      END IF;
    END $$;

    -- The API connects as the migration/login role (e.g. Supabase "postgres") and switches to
    -- lplatform_app per request with SET LOCAL ROLE, which requires membership on PG16+.
    DO $grant$
    BEGIN
      EXECUTE format('GRANT lplatform_app TO %I', current_user);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not grant lplatform_app to %: %', current_user, SQLERRM;
    END $grant$;

    GRANT USAGE ON SCHEMA public TO lplatform_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lplatform_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lplatform_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO lplatform_app;
  `);

  // 4. Acyclic RLS helper functions (session GUC getters + SECURITY DEFINER membership helpers)
  await client.query(`
    CREATE OR REPLACE FUNCTION app_user_id() RETURNS TEXT
    LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('app.user_id', true), ''), '');
    $$;

    CREATE OR REPLACE FUNCTION app_role() RETURNS TEXT
    LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('app.user_role', true), ''), '');
    $$;

    CREATE OR REPLACE FUNCTION app_org_id() RETURNS TEXT
    LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('app.organization_id', true), ''), '');
    $$;

    CREATE OR REPLACE FUNCTION app_sys_ctx() RETURNS TEXT
    LANGUAGE sql STABLE AS $$
      SELECT COALESCE(NULLIF(current_setting('app.system_context', true), ''), '');
    $$;

    CREATE OR REPLACE FUNCTION app_is_owner() RETURNS BOOLEAN
    LANGUAGE sql STABLE AS $$
      SELECT app_role() IN ('PLATFORM_OWNER', 'PLATFORM_ADMIN');
    $$;

    CREATE OR REPLACE FUNCTION rls_class_org_id(p_class_id TEXT) RETURNS TEXT
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT organization_id FROM classes WHERE id = p_class_id LIMIT 1;
    $$;

    CREATE OR REPLACE FUNCTION rls_section_org_id(p_section_id TEXT) RETURNS TEXT
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT c.organization_id
      FROM sections s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = p_section_id
      LIMIT 1;
    $$;

    CREATE OR REPLACE FUNCTION rls_student_assigned_assessment(p_assessment_id TEXT, p_student_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1
        FROM course_assessment_assignments caa
        JOIN student_section_memberships ssm ON ssm.section_id = caa.section_id
        WHERE caa.assessment_id = p_assessment_id
          AND caa.status = 'ACTIVE'
          AND ssm.student_id = p_student_id
          AND ssm.status = 'ACTIVE'
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_is_student_in_section(p_student_id TEXT, p_section_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM student_section_memberships
        WHERE student_id = p_student_id AND section_id = p_section_id AND status = 'ACTIVE'
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_is_teacher_in_section(p_teacher_id TEXT, p_section_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM teacher_section_memberships
        WHERE teacher_id = p_teacher_id AND section_id = p_section_id AND status = 'ACTIVE'
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_teacher_shares_student(p_teacher_id TEXT, p_student_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1
        FROM student_section_memberships ssm
        JOIN teacher_section_memberships tsm ON tsm.section_id = ssm.section_id
        WHERE ssm.student_id = p_student_id
          AND tsm.teacher_id = p_teacher_id
          AND ssm.status = 'ACTIVE'
          AND tsm.status = 'ACTIVE'
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_student_shares_teacher(p_student_id TEXT, p_teacher_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT rls_teacher_shares_student(p_teacher_id, p_student_id);
    $$;

    CREATE OR REPLACE FUNCTION rls_student_in_org(p_student_id TEXT, p_org_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_student_id AND u.organization_id = p_org_id
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_question_readable(p_question_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM questions q
        WHERE q.id = p_question_id
          AND (
            app_is_owner()
            OR (app_role() = 'PLATFORM_DEVELOPER' AND q.organization_id IS NULL)
            OR (
              (q.organization_id IS NULL OR q.organization_id = app_org_id())
              AND (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') OR q.status IN ('PUBLISHED', 'ACTIVE'))
            )
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_question_writable(p_question_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM questions q
        WHERE q.id = p_question_id
          AND (
            app_is_owner()
            OR (app_role() = 'PLATFORM_DEVELOPER' AND q.organization_id IS NULL)
            OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND q.organization_id = app_org_id())
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_assignment_readable(p_assignment_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = p_assignment_id
          AND (
            app_is_owner()
            OR (
              a.organization_id = app_org_id()
              AND (
                app_role() = 'ORGANIZATION_ADMIN'
                OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), a.section_id))
                OR (app_role() = 'STUDENT' AND a.status = 'PUBLISHED' AND rls_is_student_in_section(app_user_id(), a.section_id))
              )
            )
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_assignment_writable(p_assignment_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = p_assignment_id
          AND (
            app_is_owner()
            OR (
              a.organization_id = app_org_id()
              AND (
                app_role() = 'ORGANIZATION_ADMIN'
                OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), a.section_id))
              )
            )
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_submission_readable(p_submission_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.id = p_submission_id
          AND (
            app_is_owner()
            OR (app_role() = 'STUDENT' AND s.student_id = app_user_id())
            OR (app_role() = 'ORGANIZATION_ADMIN' AND a.organization_id = app_org_id())
            OR (app_role() = 'TEACHER' AND a.organization_id = app_org_id() AND rls_is_teacher_in_section(app_user_id(), a.section_id))
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_assessment_readable(p_assessment_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM course_assessments ca
        WHERE ca.id = p_assessment_id
          AND (
            app_is_owner()
            OR (app_role() = 'PLATFORM_DEVELOPER' AND ca.scope = 'PLATFORM')
            OR (ca.organization_id = app_org_id() AND app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER'))
            OR (ca.scope = 'PLATFORM' AND ca.status IN ('PUBLISHED', 'ACTIVE') AND app_role() <> '')
            OR (
              app_role() = 'STUDENT'
              AND ca.status IN ('PUBLISHED', 'ACTIVE')
              AND EXISTS (
                SELECT 1 FROM course_assessment_assignments caa
                WHERE caa.assessment_id = ca.id
                  AND caa.status = 'ACTIVE'
                  AND rls_is_student_in_section(app_user_id(), caa.section_id)
              )
            )
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_assessment_writable(p_assessment_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM course_assessments ca
        WHERE ca.id = p_assessment_id
          AND (
            app_is_owner()
            OR (app_role() = 'PLATFORM_DEVELOPER' AND ca.scope = 'PLATFORM' AND ca.organization_id IS NULL)
            OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND ca.organization_id = app_org_id())
          )
      );
    $$;

    CREATE OR REPLACE FUNCTION rls_attempt_readable(p_attempt_id TEXT) RETURNS BOOLEAN
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
      SELECT EXISTS (
        SELECT 1 FROM course_assessment_attempts att
        WHERE att.id = p_attempt_id
          AND app_role() <> 'PLATFORM_DEVELOPER'
          AND (
            app_is_owner()
            OR (app_role() = 'STUDENT' AND att.student_id = app_user_id())
            OR (app_role() = 'ORGANIZATION_ADMIN' AND (att.organization_id = app_org_id() OR rls_student_in_org(att.student_id, app_org_id())))
            OR (app_role() = 'TEACHER' AND rls_teacher_shares_student(app_user_id(), att.student_id))
          )
      );
    $$;

    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO lplatform_app;
  `);

  // 5. Enable + FORCE RLS and create policies on every table
  await client.query(`
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_org_select ON organizations;
    CREATE POLICY p_org_select ON organizations FOR SELECT USING (
      app_is_owner()
      OR app_sys_ctx() IN ('AUTH', 'PUBLIC_CATALOG')
      OR (app_role() <> 'PLATFORM_DEVELOPER' AND id = app_org_id())
    );
    DROP POLICY IF EXISTS p_org_write ON organizations;
    CREATE POLICY p_org_write ON organizations FOR ALL USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND id = app_org_id())
    ) WITH CHECK (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND id = app_org_id())
    );

    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE users FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_users_select ON users;
    CREATE POLICY p_users_select ON users FOR SELECT USING (
      app_is_owner()
      OR app_sys_ctx() = 'AUTH'
      OR id = app_user_id()
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
      OR (app_role() = 'STUDENT' AND rls_student_shares_teacher(app_user_id(), id))
    );
    DROP POLICY IF EXISTS p_users_write ON users;
    CREATE POLICY p_users_write ON users FOR ALL USING (
      app_is_owner()
      OR app_sys_ctx() = 'AUTH'
      OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
      OR id = app_user_id()
    ) WITH CHECK (
      app_is_owner()
      OR app_sys_ctx() = 'AUTH'
      OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
      OR id = app_user_id()
    );

    ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
    ALTER TABLE credentials FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_cred_all ON credentials;
    CREATE POLICY p_cred_all ON credentials FOR ALL USING (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR (app_role() <> 'PLATFORM_DEVELOPER' AND user_id = app_user_id())
    ) WITH CHECK (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR user_id = app_user_id()
    );

    ALTER TABLE refresh_sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE refresh_sessions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_refresh_all ON refresh_sessions;
    CREATE POLICY p_refresh_all ON refresh_sessions FOR ALL USING (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR user_id = app_user_id()
    ) WITH CHECK (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR user_id = app_user_id()
    );

    ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
    ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_pwreset_all ON password_reset_tokens;
    CREATE POLICY p_pwreset_all ON password_reset_tokens FOR ALL USING (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR user_id = app_user_id()
    ) WITH CHECK (
      app_sys_ctx() = 'AUTH' OR app_is_owner() OR user_id = app_user_id()
    );

    ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE classes FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_classes_select ON classes;
    CREATE POLICY p_classes_select ON classes FOR SELECT USING (
      app_is_owner()
      OR app_sys_ctx() = 'JOIN_LOOKUP'
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER', 'STUDENT') AND organization_id = app_org_id())
    );
    DROP POLICY IF EXISTS p_classes_write ON classes;
    CREATE POLICY p_classes_write ON classes FOR ALL USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
    ) WITH CHECK (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
    );

    ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sections FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_sections_select ON sections;
    CREATE POLICY p_sections_select ON sections FOR SELECT USING (
      app_is_owner()
      OR app_sys_ctx() = 'JOIN_LOOKUP'
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_class_org_id(class_id) = app_org_id())
      OR (app_role() = 'STUDENT' AND rls_is_student_in_section(app_user_id(), id))
    );
    DROP POLICY IF EXISTS p_sections_write ON sections;
    DROP POLICY IF EXISTS p_sections_insert ON sections;
    CREATE POLICY p_sections_insert ON sections FOR INSERT WITH CHECK (
      app_is_owner()
      OR (app_role() = 'ORGANIZATION_ADMIN' AND rls_class_org_id(class_id) = app_org_id())
    );
    DROP POLICY IF EXISTS p_sections_update_del ON sections;
    CREATE POLICY p_sections_update_del ON sections FOR UPDATE USING (
      app_is_owner()
      OR (
        rls_class_org_id(class_id) = app_org_id()
        AND (
          app_role() = 'ORGANIZATION_ADMIN'
          OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), id))
        )
      )
    ) WITH CHECK (
      app_is_owner()
      OR (
        rls_class_org_id(class_id) = app_org_id()
        AND (
          app_role() = 'ORGANIZATION_ADMIN'
          OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), id))
        )
      )
    );
    DROP POLICY IF EXISTS p_sections_delete ON sections;
    CREATE POLICY p_sections_delete ON sections FOR DELETE USING (
      app_is_owner()
      OR (app_role() = 'ORGANIZATION_ADMIN' AND rls_class_org_id(class_id) = app_org_id())
    );

    ALTER TABLE student_section_memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE student_section_memberships FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_ssm_select ON student_section_memberships;
    CREATE POLICY p_ssm_select ON student_section_memberships FOR SELECT USING (
      app_is_owner()
      OR (app_role() = 'STUDENT' AND student_id = app_user_id())
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_section_org_id(section_id) = app_org_id())
    );
    DROP POLICY IF EXISTS p_ssm_write ON student_section_memberships;
    CREATE POLICY p_ssm_write ON student_section_memberships FOR ALL USING (
      app_is_owner()
      OR (app_role() = 'STUDENT' AND student_id = app_user_id() AND rls_section_org_id(section_id) = app_org_id())
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_section_org_id(section_id) = app_org_id())
    ) WITH CHECK (
      app_is_owner()
      OR (app_role() = 'STUDENT' AND student_id = app_user_id() AND rls_section_org_id(section_id) = app_org_id())
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_section_org_id(section_id) = app_org_id())
    );

    ALTER TABLE teacher_section_memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE teacher_section_memberships FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_tsm_select ON teacher_section_memberships;
    CREATE POLICY p_tsm_select ON teacher_section_memberships FOR SELECT USING (
      app_is_owner()
      OR teacher_id = app_user_id()
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_section_org_id(section_id) = app_org_id())
      OR (app_role() = 'STUDENT' AND rls_is_student_in_section(app_user_id(), section_id))
    );
    DROP POLICY IF EXISTS p_tsm_write ON teacher_section_memberships;
    CREATE POLICY p_tsm_write ON teacher_section_memberships FOR ALL USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND rls_section_org_id(section_id) = app_org_id())
    ) WITH CHECK (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND rls_section_org_id(section_id) = app_org_id())
    );

    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE courses FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_courses_select ON courses;
    CREATE POLICY p_courses_select ON courses FOR SELECT USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (organization_id IS NULL AND (status IN ('PUBLISHED', 'ACTIVE') OR app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER')))
      OR (organization_id = app_org_id() AND (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') OR status IN ('PUBLISHED', 'ACTIVE')))
    );
    DROP POLICY IF EXISTS p_courses_write ON courses;
    CREATE POLICY p_courses_write ON courses FOR ALL USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    ) WITH CHECK (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    );

    ALTER TABLE course_allocations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_allocations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_alloc_select ON course_allocations;
    CREATE POLICY p_alloc_select ON course_allocations FOR SELECT USING (
      app_is_owner()
      OR (app_role() <> 'PLATFORM_DEVELOPER' AND (organization_id = app_org_id() OR rls_section_org_id(section_id) = app_org_id()))
    );
    DROP POLICY IF EXISTS p_alloc_write ON course_allocations;
    CREATE POLICY p_alloc_write ON course_allocations FOR ALL USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_section_org_id(section_id) = app_org_id()))
    ) WITH CHECK (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_section_org_id(section_id) = app_org_id()))
    );

    ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE questions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_questions_select ON questions;
    CREATE POLICY p_questions_select ON questions FOR SELECT USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (
        (organization_id IS NULL OR organization_id = app_org_id())
        AND (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') OR status IN ('PUBLISHED', 'ACTIVE'))
      )
    );
    DROP POLICY IF EXISTS p_questions_write ON questions;
    CREATE POLICY p_questions_write ON questions FOR ALL USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    ) WITH CHECK (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    );

    ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
    ALTER TABLE question_options FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_qopts_select ON question_options;
    CREATE POLICY p_qopts_select ON question_options FOR SELECT USING (rls_question_readable(question_id));
    DROP POLICY IF EXISTS p_qopts_write ON question_options;
    CREATE POLICY p_qopts_write ON question_options FOR ALL USING (rls_question_writable(question_id)) WITH CHECK (rls_question_writable(question_id));

    ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
    ALTER TABLE test_cases FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_tc_select ON test_cases;
    CREATE POLICY p_tc_select ON test_cases FOR SELECT USING (rls_question_readable(question_id));
    DROP POLICY IF EXISTS p_tc_write ON test_cases;
    CREATE POLICY p_tc_write ON test_cases FOR ALL USING (rls_question_writable(question_id)) WITH CHECK (rls_question_writable(question_id));

    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE assignments FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_asg_select ON assignments;
    CREATE POLICY p_asg_select ON assignments FOR SELECT USING (
      app_is_owner()
      OR (
        organization_id = app_org_id()
        AND (
          app_role() = 'ORGANIZATION_ADMIN'
          OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), section_id))
          OR (app_role() = 'STUDENT' AND status = 'PUBLISHED' AND rls_is_student_in_section(app_user_id(), section_id))
        )
      )
    );
    DROP POLICY IF EXISTS p_asg_write ON assignments;
    CREATE POLICY p_asg_write ON assignments FOR ALL USING (
      app_is_owner()
      OR (
        organization_id = app_org_id()
        AND (
          app_role() = 'ORGANIZATION_ADMIN'
          OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), section_id))
        )
      )
    ) WITH CHECK (
      app_is_owner()
      OR (
        organization_id = app_org_id()
        AND (
          app_role() = 'ORGANIZATION_ADMIN'
          OR (app_role() = 'TEACHER' AND rls_is_teacher_in_section(app_user_id(), section_id))
        )
      )
    );

    ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE assignment_questions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_aq_select ON assignment_questions;
    CREATE POLICY p_aq_select ON assignment_questions FOR SELECT USING (rls_assignment_readable(assignment_id));
    DROP POLICY IF EXISTS p_aq_write ON assignment_questions;
    CREATE POLICY p_aq_write ON assignment_questions FOR ALL USING (rls_assignment_writable(assignment_id)) WITH CHECK (rls_assignment_writable(assignment_id));

    ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_sub_select ON submissions;
    CREATE POLICY p_sub_select ON submissions FOR SELECT USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
        OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_assignment_readable(assignment_id))
      )
    );
    DROP POLICY IF EXISTS p_sub_insert ON submissions;
    CREATE POLICY p_sub_insert ON submissions FOR INSERT WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id() AND rls_assignment_readable(assignment_id))
      )
    );
    DROP POLICY IF EXISTS p_sub_update ON submissions;
    CREATE POLICY p_sub_update ON submissions FOR UPDATE USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_assignment_writable(assignment_id))
      )
    ) WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND rls_assignment_writable(assignment_id))
      )
    );
    DROP POLICY IF EXISTS p_sub_delete ON submissions;
    CREATE POLICY p_sub_delete ON submissions FOR DELETE USING (
      app_is_owner()
      OR (app_role() = 'ORGANIZATION_ADMIN' AND rls_assignment_writable(assignment_id))
    );

    ALTER TABLE submission_results ENABLE ROW LEVEL SECURITY;
    ALTER TABLE submission_results FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_subres_select ON submission_results;
    CREATE POLICY p_subres_select ON submission_results FOR SELECT USING (rls_submission_readable(submission_id));
    DROP POLICY IF EXISTS p_subres_write ON submission_results;
    CREATE POLICY p_subres_write ON submission_results FOR ALL USING (
      app_is_owner()
    ) WITH CHECK (
      app_is_owner()
    );

    ALTER TABLE course_assessments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessments FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_ca_select ON course_assessments;
    CREATE POLICY p_ca_select ON course_assessments FOR SELECT USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND scope = 'PLATFORM')
      OR (organization_id = app_org_id() AND app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER'))
      OR (scope = 'PLATFORM' AND status IN ('PUBLISHED', 'ACTIVE') AND app_role() <> '')
      OR (app_role() = 'STUDENT' AND status IN ('PUBLISHED', 'ACTIVE') AND rls_student_assigned_assessment(id, app_user_id()))
    );
    DROP POLICY IF EXISTS p_ca_insert ON course_assessments;
    CREATE POLICY p_ca_insert ON course_assessments FOR INSERT WITH CHECK (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND scope = 'PLATFORM' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    );
    DROP POLICY IF EXISTS p_ca_update_del ON course_assessments;
    CREATE POLICY p_ca_update_del ON course_assessments FOR UPDATE USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND scope = 'PLATFORM' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    ) WITH CHECK (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND scope = 'PLATFORM' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    );
    DROP POLICY IF EXISTS p_ca_delete ON course_assessments;
    CREATE POLICY p_ca_delete ON course_assessments FOR DELETE USING (
      app_is_owner()
      OR (app_role() = 'PLATFORM_DEVELOPER' AND scope = 'PLATFORM' AND organization_id IS NULL)
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
    );

    ALTER TABLE course_assessment_questions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessment_questions FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_caq_select ON course_assessment_questions;
    CREATE POLICY p_caq_select ON course_assessment_questions FOR SELECT USING (rls_assessment_readable(assessment_id));
    DROP POLICY IF EXISTS p_caq_write ON course_assessment_questions;
    CREATE POLICY p_caq_write ON course_assessment_questions FOR ALL USING (rls_assessment_writable(assessment_id)) WITH CHECK (rls_assessment_writable(assessment_id));

    ALTER TABLE course_assessment_assignments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessment_assignments FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_caa_select ON course_assessment_assignments;
    CREATE POLICY p_caa_select ON course_assessment_assignments FOR SELECT USING (
      app_is_owner()
      OR (app_role() IN ('ORGANIZATION_ADMIN', 'TEACHER') AND organization_id = app_org_id())
      OR (app_role() = 'STUDENT' AND rls_is_student_in_section(app_user_id(), section_id))
    );
    DROP POLICY IF EXISTS p_caa_write ON course_assessment_assignments;
    CREATE POLICY p_caa_write ON course_assessment_assignments FOR ALL USING (
      app_is_owner()
      OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
      OR (app_role() = 'TEACHER' AND organization_id = app_org_id() AND rls_is_teacher_in_section(app_user_id(), section_id))
    ) WITH CHECK (
      app_is_owner()
      OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
      OR (app_role() = 'TEACHER' AND organization_id = app_org_id() AND rls_is_teacher_in_section(app_user_id(), section_id))
    );

    ALTER TABLE course_assessment_attempts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessment_attempts FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_att_select ON course_assessment_attempts;
    CREATE POLICY p_att_select ON course_assessment_attempts FOR SELECT USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
        OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_student_in_org(student_id, app_org_id())))
        OR (app_role() = 'TEACHER' AND rls_teacher_shares_student(app_user_id(), student_id))
      )
    );
    DROP POLICY IF EXISTS p_att_insert ON course_assessment_attempts;
    CREATE POLICY p_att_insert ON course_assessment_attempts FOR INSERT WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id() AND rls_assessment_readable(assessment_id))
      )
    );
    DROP POLICY IF EXISTS p_att_update ON course_assessment_attempts;
    CREATE POLICY p_att_update ON course_assessment_attempts FOR UPDATE USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
        OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_student_in_org(student_id, app_org_id())))
        OR (app_role() = 'TEACHER' AND rls_teacher_shares_student(app_user_id(), student_id))
      )
    ) WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
        OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_student_in_org(student_id, app_org_id())))
        OR (app_role() = 'TEACHER' AND rls_teacher_shares_student(app_user_id(), student_id))
      )
    );

    ALTER TABLE course_assessment_answers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessment_answers FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_ans_select ON course_assessment_answers;
    CREATE POLICY p_ans_select ON course_assessment_answers FOR SELECT USING (rls_attempt_readable(attempt_id));
    DROP POLICY IF EXISTS p_ans_write ON course_assessment_answers;
    CREATE POLICY p_ans_write ON course_assessment_answers FOR ALL USING (rls_attempt_readable(attempt_id)) WITH CHECK (rls_attempt_readable(attempt_id));

    ALTER TABLE course_assessment_reviews ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_assessment_reviews FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_rev_select ON course_assessment_reviews;
    CREATE POLICY p_rev_select ON course_assessment_reviews FOR SELECT USING (rls_attempt_readable(attempt_id));
    DROP POLICY IF EXISTS p_rev_write ON course_assessment_reviews;
    CREATE POLICY p_rev_write ON course_assessment_reviews FOR ALL USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND app_role() <> 'STUDENT'
      AND rls_attempt_readable(attempt_id)
    ) WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND app_role() <> 'STUDENT'
      AND rls_attempt_readable(attempt_id)
    );

    ALTER TABLE course_lesson_progress ENABLE ROW LEVEL SECURITY;
    ALTER TABLE course_lesson_progress FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_clp_select ON course_lesson_progress;
    CREATE POLICY p_clp_select ON course_lesson_progress FOR SELECT USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
        OR (app_role() = 'ORGANIZATION_ADMIN' AND (organization_id = app_org_id() OR rls_student_in_org(student_id, app_org_id())))
        OR (app_role() = 'TEACHER' AND rls_teacher_shares_student(app_user_id(), student_id))
      )
    );
    DROP POLICY IF EXISTS p_clp_write ON course_lesson_progress;
    CREATE POLICY p_clp_write ON course_lesson_progress FOR ALL USING (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
      )
    ) WITH CHECK (
      app_role() <> 'PLATFORM_DEVELOPER'
      AND (
        app_is_owner()
        OR (app_role() = 'STUDENT' AND student_id = app_user_id())
      )
    );

    ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_inv_all ON invitations;
    CREATE POLICY p_inv_all ON invitations FOR ALL USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
    ) WITH CHECK (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
    );

    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_audit_select ON audit_logs;
    CREATE POLICY p_audit_select ON audit_logs FOR SELECT USING (
      app_is_owner() OR (app_role() = 'ORGANIZATION_ADMIN' AND organization_id = app_org_id())
    );
    DROP POLICY IF EXISTS p_audit_insert ON audit_logs;
    CREATE POLICY p_audit_insert ON audit_logs FOR INSERT WITH CHECK (
      app_role() <> '' OR app_sys_ctx() IN ('AUTH', 'PUBLIC_CATALOG')
    );

    ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE platform_settings FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS p_settings_select ON platform_settings;
    CREATE POLICY p_settings_select ON platform_settings FOR SELECT USING (
      app_is_owner() OR app_role() IN ('PLATFORM_DEVELOPER', 'ORGANIZATION_ADMIN', 'TEACHER')
    );
    DROP POLICY IF EXISTS p_settings_write ON platform_settings;
    CREATE POLICY p_settings_write ON platform_settings FOR ALL USING (
      app_is_owner()
    ) WITH CHECK (
      app_is_owner()
    );
  `);
}
