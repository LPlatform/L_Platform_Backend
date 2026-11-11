# AI Readiness Course delivery status

## Current implementation

The backend serves one platform-wide `AI Readiness Course` at `/api/learning/ai-readiness`. The endpoint requires an authenticated account, returns 404 when the course is unpublished, and requires an active organization-level allocation for non-platform-admin users. Course content is one shared source; it is not copied per student.

The course is inserted idempotently by the existing migration script as `crs-ai-readiness-001`. The migration adds one active organization-scope allocation for every active organization. An organization trigger applies that same allocation when an organization is created or becomes active. New classes, sections and enrolled students inherit the organization allocation through the existing allocation scope model. Re-running the migration does not create duplicate allocations.

## Content coverage

The content is original, student-facing paraphrase grounded in the supplied source. It is not a transcription. The course record contains eight modules, two lesson texts per module (16 total), learning objectives, key concepts, lesson activities, revision notes, practice/discussion prompts and handbook page references.

| Module                                      | Handbook printed pages | Topics in course content                                                       |
| ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Introduction to Artificial Intelligence     | 1-17                   | AI and automation, domains, learning approaches, benefits and limits           |
| Careers and Opportunities in AI             | 18-27                  | Roles, team work, skills and a career investigation activity                   |
| Python Programming                          | 28-54                  | Fundamentals, control flow, collections, CSV, NumPy, Pandas and model workflow |
| Introduction to Capstone Projects           | 55-70                  | Problem framing, stakeholders, planning, evaluation and presentation           |
| Data Literacy                               | 71-98                  | Sources, sampling, measurement, quality, preprocessing and interpretation      |
| Machine Learning Algorithms                 | 99-122                 | Learning settings, regression, classification, KNN and K-Means                 |
| Linguistics and Natural Language Processing | 123-136                | Language analysis, sentiment, classification, intent and dialogue              |
| AI Ethics and Values                        | 137-150                | Explainability, fairness, robustness, transparency, privacy, bias and policy   |

The source describes five ethics pillars on printed page 139: explainability, fairness, robustness, transparency and privacy. Course explanations paraphrase those concepts.

## Evidence from the current local environment

- Supplied PDF identity was checked: 156 PDF pages, title content identifies the Artificial Intelligence Curriculum Student Handbook and Subject Code 843. Printed index identifies eight units and their starting pages.
- On the preserved disposable PostgreSQL database, `pnpm db:migrate` completed twice. After migration, 16 active organizations had 16 active organization-scope allocations for this course.
- A transaction-scoped test insert for a new active organization produced one course allocation; the test transaction was rolled back.
- A local student login followed by an authenticated GET of `/api/learning/ai-readiness` returned HTTP 200 with 8 modules and 16 lessons. A metadata scan found none of the prohibited grade labels in the returned course object.
- Backend format, lint, typecheck, 7 unit tests, 3 integration tests and build passed after the content/route changes. Student app format, lint, typecheck, 4 unit tests and Vite build passed. Web format, lint, typecheck and 50 unit tests passed after adding the teacher reader.

These are local development checks on a disposable database. They do not establish RLS, production isolation or a complete course workflow.

## Not yet delivered

- Required assessment bank: **0 scored assessment items**. The 24 practice prompts have no answer key, objective mapping, marks or difficulty and must not be represented as the requested assessment bank.
- Module assessments, attempt tracking, grading, teacher review, due windows and student result history are not implemented for this course.
- Study resources are not downloadable and the source PDF is not bundled or served by the platform.
- Course progress/adoption reporting is not implemented beyond the existing allocation reach fields.
- No content-management UI for editing modules/lessons or explicit course publishing controls was added. Publishing is checked against the existing course record state.
- Existing `course_allocations` has no uniqueness constraint; this migration's seed and trigger are idempotent through a `NOT EXISTS` guard and deterministic IDs, but concurrent allocation writes are not protected by a database uniqueness rule.
- No role-based UI/API end-to-end run was possible from the native app; the user must complete sign-in in the open app. RLS and cross-tenant policy tests remain blocked as recorded in the root status document.

## Local development

Apply the migration with `pnpm db:migrate` from `L_Platform_Backend`. The normal API runs on port 3001. Authenticated users in an active organization can retrieve the course when the organization allocation is active. The Student app dashboard and Teacher portal navigation include a course reader; they require an authenticated session and reachable API.

## M8 assessment foundation update (2026-11-11)

This update adds normalized assessment, assignment, attempt, answer, review-history and lesson-progress schema with additive/idempotent SQL in `src/db/migrate.ts`. The migration was applied twice successfully to the preserved disposable database on port 5433. Student API routes cover assigned assessment discovery, attempt start, protected answer saves, objective grading (MCQ/true-false/fill/multi-select), manual-review pending status, submit and lesson-completion progress. Student serialization removes correctness flags from answer options. Teacher APIs provide a section-scoped manual-review queue, score/feedback submission and result release. The native Student dashboard has an online assessment attempt UI and lesson completion action.

Current verification after this update: backend typecheck, lint, 7 unit tests, 3 integration tests, build and migration rerun passed; Student app typecheck, lint, 4 tests and Vite build passed; Web typecheck, lint, 50 tests and Next production build passed. These tests do not yet exercise authenticated assessment flows end to end.

M8 remains **BLOCKED / INCOMPLETE** for release. The authored scored bank remains **0/352**; no teacher UI exists for authoring, publishing or assigning M8 assessments, the review API has no teacher screen, and there is no complete released-result/history UI. There are no assessment-specific integration tests, question snapshots are not frozen at publish time, and the student UI does not yet show the full progress summary. PostgreSQL RLS is still absent. Do not treat the new tables and endpoints as production-secure or the course as fully assessable until those gaps are closed and tested.
