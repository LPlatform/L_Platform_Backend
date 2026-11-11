import { describe, expect, it } from 'vitest';
import {
  extractJoinCode,
  formatReleasedResult,
  sanitizeAttemptQuestion,
} from '../../routes/lms.routes.js';

describe('LMS helpers', () => {
  it('extracts join codes from raw codes and invite URLs', () => {
    expect(extractJoinCode('SEC-GRADE10A-001')).toBe('sec-grade10a-001');
    expect(extractJoinCode('https://app.lplatform.edu/join?code=Sec-Grade10B-002')).toBe(
      'sec-grade10b-002',
    );
    expect(extractJoinCode('lplatform://class?join=sec-demo-1')).toBe('sec-demo-1');
    expect(extractJoinCode('   ')).toBe('');
  });

  it('strips answer keys and grading metadata from student attempt questions', () => {
    const sanitized = sanitizeAttemptQuestion(
      {
        questionId: 'q-1',
        marks: 5,
        questionSnapshot: {},
        question: {
          id: 'q-1',
          organizationId: null,
          courseId: 'crs-ai-readiness-001',
          createdBy: null,
          title: 'AI Pillars',
          description: 'Which pillar deals with bias?',
          inputFormat: null,
          outputFormat: null,
          constraints: null,
          examples: [],
          explanation: 'Confidential teacher explanation',
          difficulty: 'EASY',
          topic: 'Ethics',
          supportedLanguages: ['PYTHON'],
          marks: 5,
          questionType: 'MCQ',
          courseModuleId: 'm8-ai-ethics',
          lessonId: null,
          learningObjective: null,
          sourcePage: null,
          answerKey: { correctOption: 'Fairness' },
          rubric: [{ criterion: 'Secret' }],
          estimatedMinutes: 2,
          negativeMarks: 0,
          allowPartialCredit: false,
          status: 'PUBLISHED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      [
        { id: 'opt-1', optionText: 'Fairness', orderNum: 1 },
        { id: 'opt-2', optionText: 'Latency', orderNum: 2 },
      ],
    );

    expect(sanitized).not.toHaveProperty('answerKey');
    expect(sanitized).not.toHaveProperty('rubric');
    expect(sanitized).not.toHaveProperty('explanation');
    expect(sanitized.options).toHaveLength(2);
    expect(sanitized.marks).toBe(5);
  });

  it('hides scores and release timestamps unless an attempt status is RELEASED', () => {
    const base = {
      id: 'att-1',
      assessmentId: 'asmt-1',
      assignmentId: 'caa-1',
      studentId: 'stu-1',
      organizationId: 'org-1',
      assessmentVersion: 1,
      attemptNumber: 1,
      status: 'GRADED',
      score: 18,
      totalMarks: 20,
      passed: true,
      startedAt: new Date('2026-11-10T10:00:00Z'),
      submittedAt: new Date('2026-11-10T10:20:00Z'),
      gradedAt: new Date('2026-11-10T11:00:00Z'),
      releasedAt: null,
      graderId: 't-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const unreleased = formatReleasedResult(base);
    expect(unreleased.score).toBeNull();
    expect(unreleased.passed).toBeNull();
    expect(unreleased.feedbackReleased).toBe(false);

    const released = formatReleasedResult({
      ...base,
      status: 'RELEASED',
      releasedAt: new Date('2026-11-10T12:00:00Z'),
    });
    expect(released.score).toBe(18);
    expect(released.passed).toBe(true);
    expect(released.feedbackReleased).toBe(true);
    expect(released.releasedAt).toBe('2026-11-10T12:00:00.000Z');
  });
});
