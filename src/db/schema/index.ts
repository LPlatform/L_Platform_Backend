import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Organizations
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  type: text('type').notNull().default('SCHOOL'),
  description: text('description'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED
  contactName: text('contact_name').notNull().default(''),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  city: text('city').notNull().default(''),
  state: text('state').notNull().default(''),
  country: text('country').notNull().default(''),
  postalCode: text('postal_code').notNull().default(''),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // PLATFORM_ADMIN, ORGANIZATION_ADMIN, TEACHER, STUDENT
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Credentials
export const credentials = pgTable('credentials', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Refresh sessions
export const refreshSessions = pgTable('refresh_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Classes
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  academicYear: text('academic_year').notNull(),
  description: text('description'),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sections
export const sections = pgTable('sections', {
  id: text('id').primaryKey(),
  classId: text('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  maxStudents: integer('max_students').notNull().default(40),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Student section memberships
export const studentSectionMemberships = pgTable('student_section_memberships', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('ACTIVE'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  leftAt: timestamp('left_at', { withTimezone: true }),
});

// Teacher section memberships
export const teacherSectionMemberships = pgTable('teacher_section_memberships', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('ACTIVE'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  removedAt: timestamp('removed_at', { withTimezone: true }),
});

// Courses
export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  title: text('title').notNull(),
  category: text('category').notNull().default(''),
  description: text('description'),
  language: text('language').notNull().default('PYTHON'), // PYTHON, JAVA, CPP
  difficulty: text('difficulty').notNull().default('BEGINNER'), // BEGINNER, INTERMEDIATE, ADVANCED
  status: text('status').notNull().default('PUBLISHED'), // DRAFT, PUBLISHED, ARCHIVED
  version: text('version').notNull().default('1.0.0'),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Course Allocations
export const courseAllocations = pgTable('course_allocations', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  classId: text('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'cascade' }),
  scope: text('scope').notNull().default('SECTION'),
  teacherId: text('teacher_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE, COMPLETED, REVOKED
  accessEnabled: boolean('access_enabled').notNull().default(true),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Questions
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  courseId: text('course_id').references(() => courses.id, { onDelete: 'set null' }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  inputFormat: text('input_format'),
  outputFormat: text('output_format'),
  constraints: text('constraints'),
  examples: jsonb('examples').default([]),
  explanation: text('explanation'),
  difficulty: text('difficulty').notNull().default('EASY'), // EASY, MEDIUM, HARD
  topic: text('topic').notNull().default('General'),
  supportedLanguages: jsonb('supported_languages').notNull().default(['PYTHON', 'JAVA', 'CPP']),
  marks: integer('marks').notNull().default(10),
  questionType: text('question_type').notNull().default('CODE'),
  courseModuleId: text('course_module_id'),
  lessonId: text('lesson_id'),
  learningObjective: text('learning_objective'),
  sourcePage: text('source_page'),
  answerKey: jsonb('answer_key'),
  rubric: jsonb('rubric'),
  estimatedMinutes: integer('estimated_minutes'),
  negativeMarks: integer('negative_marks').notNull().default(0),
  allowPartialCredit: boolean('allow_partial_credit').notNull().default(false),
  status: text('status').notNull().default('PUBLISHED'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Test Cases
export const testCases = pgTable('test_cases', {
  id: text('id').primaryKey(),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  input: text('input').notNull(),
  expectedOutput: text('expected_output').notNull(),
  isHidden: boolean('is_hidden').notNull().default(false),
  isSample: boolean('is_sample').notNull().default(false),
  orderNum: integer('order_num').notNull().default(0),
  timeLimitMs: integer('time_limit_ms').notNull().default(2000),
  memoryLimitMb: integer('memory_limit_mb').notNull().default(128),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Assignments
export const assignments = pgTable('assignments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.id, { onDelete: 'cascade' }),
  courseAllocationId: text('course_allocation_id').references(() => courseAllocations.id, {
    onDelete: 'set null',
  }),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  totalMarks: integer('total_marks').notNull().default(100),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('PUBLISHED'), // DRAFT, PUBLISHED, CLOSED, ARCHIVED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Assignment Questions
export const assignmentQuestions = pgTable('assignment_questions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id')
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  marks: integer('marks').notNull().default(10),
  orderNum: integer('order_num').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Submissions
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id')
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  language: text('language').notNull(), // PYTHON, JAVA, CPP
  status: text('status').notNull().default('PENDING'), // PENDING, EVALUATING, COMPLETED, ERROR
  score: integer('score').default(0),
  totalTestCases: integer('total_test_cases').default(0),
  passedTestCases: integer('passed_test_cases').default(0),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  evaluatedAt: timestamp('evaluated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Submission Results
export const submissionResults = pgTable('submission_results', {
  id: text('id').primaryKey(),
  submissionId: text('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  testCaseId: text('test_case_id')
    .notNull()
    .references(() => testCases.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // PASS, FAIL, TIMEOUT, MEMORY_LIMIT, RUNTIME_ERROR, COMPILE_ERROR
  actualOutput: text('actual_output'),
  executionTimeMs: integer('execution_time_ms'),
  memoryUsedKb: integer('memory_used_kb'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Objective and written course assessments share the existing questions table.
export const questionOptions = pgTable('question_options', {
  id: text('id').primaryKey(),
  questionId: text('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  orderNum: integer('order_num').notNull().default(0),
  isCorrect: boolean('is_correct').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courseAssessments = pgTable(
  'course_assessments',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    moduleId: text('module_id').notNull(),
    version: integer('version').notNull().default(1),
    title: text('title').notNull(),
    instructions: text('instructions').notNull().default(''),
    status: text('status').notNull().default('DRAFT'),
    totalMarks: integer('total_marks').notNull().default(0),
    passingMarks: integer('passing_marks'),
    durationMinutes: integer('duration_minutes'),
    attemptLimit: integer('attempt_limit').notNull().default(1),
    availableFrom: timestamp('available_from', { withTimezone: true }),
    availableUntil: timestamp('available_until', { withTimezone: true }),
    randomizeQuestions: boolean('randomize_questions').notNull().default(false),
    randomizeOptions: boolean('randomize_options').notNull().default(false),
    allowLate: boolean('allow_late').notNull().default(false),
    reviewPolicy: text('review_policy').notNull().default('AFTER_RELEASE'),
    resultReleasePolicy: text('result_release_policy').notNull().default('TEACHER'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    courseModuleIndex: index('idx_course_assessments_course_module').on(
      table.courseId,
      table.moduleId,
    ),
    versionIndex: uniqueIndex('uq_course_assessment_version').on(
      table.courseId,
      table.moduleId,
      table.title,
      table.version,
    ),
  }),
);

export const courseAssessmentQuestions = pgTable(
  'course_assessment_questions',
  {
    id: text('id').primaryKey(),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => courseAssessments.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    marks: integer('marks').notNull(),
    orderNum: integer('order_num').notNull().default(0),
    questionSnapshot: jsonb('question_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    assessmentQuestionUnique: uniqueIndex('uq_course_assessment_question').on(
      table.assessmentId,
      table.questionId,
    ),
  }),
);

export const courseAssessmentAssignments = pgTable(
  'course_assessment_assignments',
  {
    id: text('id').primaryKey(),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => courseAssessments.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    sectionId: text('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    assignedBy: text('assigned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    startAt: timestamp('start_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    status: text('status').notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueAssignment: uniqueIndex('uq_assessment_section_assignment').on(
      table.assessmentId,
      table.sectionId,
    ),
    sectionIndex: index('idx_assessment_assignment_section').on(table.sectionId, table.status),
  }),
);

export const courseAssessmentAttempts = pgTable(
  'course_assessment_attempts',
  {
    id: text('id').primaryKey(),
    assessmentId: text('assessment_id')
      .notNull()
      .references(() => courseAssessments.id, { onDelete: 'restrict' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => courseAssessmentAssignments.id, { onDelete: 'restrict' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    assessmentVersion: integer('assessment_version').notNull(),
    attemptNumber: integer('attempt_number').notNull(),
    status: text('status').notNull().default('IN_PROGRESS'),
    score: integer('score'),
    totalMarks: integer('total_marks').notNull(),
    passed: boolean('passed'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    gradedAt: timestamp('graded_at', { withTimezone: true }),
    releasedAt: timestamp('released_at', { withTimezone: true }),
    graderId: text('grader_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    attemptUnique: uniqueIndex('uq_course_assessment_student_attempt').on(
      table.assessmentId,
      table.studentId,
      table.attemptNumber,
    ),
    studentOrgIndex: index('idx_assessment_attempt_student_org').on(
      table.studentId,
      table.organizationId,
      table.status,
    ),
  }),
);

export const courseAssessmentAnswers = pgTable(
  'course_assessment_answers',
  {
    id: text('id').primaryKey(),
    attemptId: text('attempt_id')
      .notNull()
      .references(() => courseAssessmentAttempts.id, { onDelete: 'cascade' }),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id, { onDelete: 'restrict' }),
    response: jsonb('response').notNull().default({}),
    status: text('status').notNull().default('SAVED'),
    marksAwarded: integer('marks_awarded'),
    feedback: text('feedback'),
    answeredAt: timestamp('answered_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    answerUnique: uniqueIndex('uq_course_assessment_attempt_answer').on(
      table.attemptId,
      table.questionId,
    ),
  }),
);

export const courseAssessmentReviews = pgTable('course_assessment_reviews', {
  id: text('id').primaryKey(),
  attemptId: text('attempt_id')
    .notNull()
    .references(() => courseAssessmentAttempts.id, { onDelete: 'restrict' }),
  answerId: text('answer_id')
    .notNull()
    .references(() => courseAssessmentAnswers.id, { onDelete: 'restrict' }),
  reviewerId: text('reviewer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  criterionMarks: jsonb('criterion_marks').notNull().default([]),
  marksAwarded: integer('marks_awarded').notNull(),
  feedback: text('feedback').notNull().default(''),
  action: text('action').notNull().default('FINAL'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courseLessonProgress = pgTable(
  'course_lesson_progress',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    moduleId: text('module_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    progressUnique: uniqueIndex('uq_course_lesson_student').on(
      table.courseId,
      table.moduleId,
      table.lessonId,
      table.studentId,
    ),
    progressOrgIndex: index('idx_course_lesson_progress_org').on(
      table.organizationId,
      table.moduleId,
    ),
  }),
);

// Invitations
export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  channel: text('channel').notNull().default('EMAIL'),
  role: text('role').notNull().default('STUDENT'),
  status: text('status').notNull().default('PENDING'), // PENDING, ACCEPTED, EXPIRED, REVOKED
  tokenHash: text('token_hash').notNull().unique(),
  invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details').default({}),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Platform Settings
export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('default'),
  platformName: text('platform_name').notNull().default('L_Platform'),
  supportEmail: text('support_email').default('support@lplatform.dev'),
  allowedDomains: jsonb('allowed_domains').default(['*']),
  sessionTimeoutMinutes: integer('session_timeout_minutes').default(1440),
  maxFileUploadMb: integer('max_file_upload_mb').default(10),
  maintenanceMode: boolean('maintenance_mode').default(false),
  preferences: jsonb('preferences').default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  classes: many(classes),
  courses: many(courses),
  assignments: many(assignments),
  questions: many(questions),
  invitations: many(invitations),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  credentials: one(credentials, {
    fields: [users.id],
    references: [credentials.userId],
  }),
  refreshSessions: many(refreshSessions),
  studentMemberships: many(studentSectionMemberships),
  teacherMemberships: many(teacherSectionMemberships),
  submissions: many(submissions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [classes.organizationId],
    references: [organizations.id],
  }),
  sections: many(sections),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  class: one(classes, {
    fields: [sections.classId],
    references: [classes.id],
  }),
  studentMemberships: many(studentSectionMemberships),
  teacherMemberships: many(teacherSectionMemberships),
  allocations: many(courseAllocations),
  assignments: many(assignments),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [courses.organizationId],
    references: [organizations.id],
  }),
  allocations: many(courseAllocations),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  course: one(courses, {
    fields: [questions.courseId],
    references: [courses.id],
  }),
  testCases: many(testCases),
  assignmentQuestions: many(assignmentQuestions),
}));

export const courseAllocationsRelations = relations(courseAllocations, ({ one }) => ({
  course: one(courses, {
    fields: [courseAllocations.courseId],
    references: [courses.id],
  }),
  section: one(sections, {
    fields: [courseAllocations.sectionId],
    references: [sections.id],
  }),
  teacher: one(users, {
    fields: [courseAllocations.teacherId],
    references: [users.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  section: one(sections, {
    fields: [assignments.sectionId],
    references: [sections.id],
  }),
  questions: many(assignmentQuestions),
  submissions: many(submissions),
}));
