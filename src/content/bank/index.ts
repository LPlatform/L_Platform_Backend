import { aiReadinessCourse } from '../ai-readiness.js';
import { m1Questions } from './m1-questions.js';
import { m2Questions } from './m2-questions.js';
import { m3Questions } from './m3-questions.js';
import { m4Questions } from './m4-questions.js';
import { m5Questions } from './m5-questions.js';
import { m6Questions } from './m6-questions.js';
import { m7Questions } from './m7-questions.js';
import { m8Questions } from './m8-questions.js';
import {
  assignmentTypeTemplateQuestions,
  starterProgrammingQuestions,
} from './programming-library.js';
import type { BankQuestionSpec } from './types.js';

export * from './types.js';
export {
  m1Questions,
  m2Questions,
  m3Questions,
  m4Questions,
  m5Questions,
  m6Questions,
  m7Questions,
  m8Questions,
  starterProgrammingQuestions,
  assignmentTypeTemplateQuestions,
};

export const aiReadinessModuleBanks: Record<string, BankQuestionSpec[]> = {
  'm1-ai-foundations': m1Questions,
  'm2-ai-careers': m2Questions,
  'm3-python': m3Questions,
  'm4-capstone': m4Questions,
  'm5-data-literacy': m5Questions,
  'm6-machine-learning': m6Questions,
  'm7-language-nlp': m7Questions,
  'm8-ai-ethics': m8Questions,
};

export const aiReadinessQuestionBank: BankQuestionSpec[] = [
  ...m1Questions,
  ...m2Questions,
  ...m3Questions,
  ...m4Questions,
  ...m5Questions,
  ...m6Questions,
  ...m7Questions,
  ...m8Questions,
];

export const allSeedQuestions: BankQuestionSpec[] = [
  ...aiReadinessQuestionBank,
  ...starterProgrammingQuestions,
  ...assignmentTypeTemplateQuestions,
];

export interface PlatformAssessmentSpec {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  passingPercentage: number;
  questionIds: string[];
}

function selectBalancedModuleQuestions(moduleBank: BankQuestionSpec[]): string[] {
  const pick = (type: BankQuestionSpec['questionType'], count: number) =>
    moduleBank.filter((q) => q.questionType === type).slice(0, count);

  return [
    ...pick('SINGLE_MCQ', 5),
    ...pick('MULTI_SELECT', 2),
    ...pick('TRUE_FALSE', 2),
    ...pick('FILL_BLANK', 2),
    ...pick('SHORT_ANSWER', 1),
    ...pick('LONG_CASE', 1),
    ...pick('PRACTICAL', 1),
  ].map((q) => q.id);
}

export const aiReadinessAssessments: PlatformAssessmentSpec[] = aiReadinessCourse.modules.map(
  (mod) => {
    const bank = aiReadinessModuleBanks[mod.id] ?? [];
    const selectedIds = selectBalancedModuleQuestions(bank);
    return {
      id: mod.assessmentId,
      courseId: 'crs-ai-readiness-001',
      moduleId: mod.id,
      title: `Module ${mod.moduleNumber} Assessment: ${mod.title}`,
      instructions: `Covers ${mod.title} (Printed Handbook p.${mod.sourcePages}). Includes objective items (auto-graded on submit) and written/practical prompts (reviewed before result release).`,
      durationMinutes: 30,
      passingPercentage: 60,
      questionIds: selectedIds,
    };
  },
);

export interface BankValidationSummary {
  valid: boolean;
  totalAiReadinessQuestions: number;
  starterProgrammingCount: number;
  templateQuestionCount: number;
  moduleCounts: Record<string, { total: number; byType: Record<string, number> }>;
  assessmentCount: number;
  errors: string[];
}

export function validateQuestionBank(): BankValidationSummary {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const moduleCounts: Record<string, { total: number; byType: Record<string, number> }> = {};

  const expectedTypes: Record<string, number> = {
    SINGLE_MCQ: 20,
    MULTI_SELECT: 5,
    TRUE_FALSE: 5,
    FILL_BLANK: 5,
    SHORT_ANSWER: 5,
    LONG_CASE: 2,
    PRACTICAL: 2,
  };

  for (const mod of aiReadinessCourse.modules) {
    const modQuestions = aiReadinessModuleBanks[mod.id] ?? [];
    const byType: Record<string, number> = {};
    for (const q of modQuestions) {
      byType[q.questionType] = (byType[q.questionType] || 0) + 1;
    }
    moduleCounts[mod.id] = { total: modQuestions.length, byType };
    if (modQuestions.length !== 44) {
      errors.push(`Module ${mod.id} expected 44 questions, got ${modQuestions.length}`);
    }
    for (const [qType, expectedCount] of Object.entries(expectedTypes)) {
      if ((byType[qType] || 0) !== expectedCount) {
        errors.push(
          `Module ${mod.id} expected ${expectedCount} ${qType}, got ${byType[qType] || 0}`,
        );
      }
    }
  }

  for (const q of allSeedQuestions) {
    if (seenIds.has(q.id)) {
      errors.push(`Duplicate question id: ${q.id}`);
    }
    seenIds.add(q.id);
    if (!q.title.trim() || !q.description.trim() || !q.explanation.trim()) {
      errors.push(`Question ${q.id} is missing title, description, or explanation`);
    }
    if (/\bClass\s*(XI|11)\b/i.test(q.title) || /\bClass\s*(XI|11)\b/i.test(q.description)) {
      errors.push(`Question ${q.id} contains banned Class XI/11 branding`);
    }
    if (q.questionType === 'SINGLE_MCQ') {
      const correctCount = (q.options ?? []).filter((o) => o.isCorrect).length;
      if ((q.options ?? []).length < 4 || correctCount !== 1) {
        errors.push(`SINGLE_MCQ ${q.id} must have >=4 options and exactly 1 correct answer`);
      }
    } else if (q.questionType === 'MULTI_SELECT') {
      const correctCount = (q.options ?? []).filter((o) => o.isCorrect).length;
      if ((q.options ?? []).length < 4 || correctCount < 2) {
        errors.push(`MULTI_SELECT ${q.id} must have >=4 options and >=2 correct answers`);
      }
    } else if (q.questionType === 'TRUE_FALSE') {
      const correctCount = (q.options ?? []).filter((o) => o.isCorrect).length;
      if ((q.options ?? []).length !== 2 || correctCount !== 1) {
        errors.push(`TRUE_FALSE ${q.id} must have 2 options and 1 correct option`);
      }
    } else if (q.questionType === 'FILL_BLANK') {
      if (!q.acceptedAnswers || q.acceptedAnswers.length === 0) {
        errors.push(`FILL_BLANK ${q.id} must specify acceptedAnswers`);
      }
    } else if (q.questionType === 'CODE') {
      const sampleCount = (q.testCases ?? []).filter((t) => t.isSample && !t.isHidden).length;
      const hiddenCount = (q.testCases ?? []).filter((t) => t.isHidden).length;
      if (sampleCount < 1 || hiddenCount < 1) {
        errors.push(`CODE ${q.id} must include at least 1 sample and 1 hidden test case`);
      }
    } else if (!q.rubric || q.rubric.expectedPoints.length === 0) {
      errors.push(`Written/Task ${q.id} must define rubric expectedPoints`);
    }
  }

  for (const asmt of aiReadinessAssessments) {
    if (asmt.questionIds.length !== 14) {
      errors.push(
        `Assessment ${asmt.id} expected 14 balanced questions, got ${asmt.questionIds.length}`,
      );
    }
    for (const qId of asmt.questionIds) {
      if (!seenIds.has(qId)) {
        errors.push(`Assessment ${asmt.id} references unknown question ${qId}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    totalAiReadinessQuestions: aiReadinessQuestionBank.length,
    starterProgrammingCount: starterProgrammingQuestions.length,
    templateQuestionCount: assignmentTypeTemplateQuestions.length,
    moduleCounts,
    assessmentCount: aiReadinessAssessments.length,
    errors,
  };
}
