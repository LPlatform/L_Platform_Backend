import { describe, expect, it } from 'vitest';
import { aiReadinessCourse } from '../../content/ai-readiness.js';
import {
  aiReadinessAssessments,
  aiReadinessQuestionBank,
  starterProgrammingQuestions,
  validateQuestionBank,
} from '../../content/bank/index.js';

describe('AI Readiness Course & 352-Question Bank Validation', () => {
  it('covers all 8 modules and 16 lessons totaling ~10 hours (600 minutes) without Class XI branding', () => {
    expect(aiReadinessCourse.modules).toHaveLength(8);
    expect(aiReadinessCourse.recommendedHours).toBe(10);
    expect(aiReadinessCourse.estimatedMinutes).toBe(600);

    let totalLessons = 0;
    let totalMinutes = 0;
    for (const mod of aiReadinessCourse.modules) {
      expect(mod.lessons).toHaveLength(2);
      totalLessons += mod.lessons.length;
      const lessonMins = mod.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0);
      expect(mod.estimatedMinutes).toBe(lessonMins);
      totalMinutes += mod.estimatedMinutes;
      expect(mod.title).not.toMatch(/\bClass\s*(XI|11)\b/i);
      expect(mod.introduction).not.toMatch(/\bClass\s*(XI|11)\b/i);
    }

    expect(totalLessons).toBe(16);
    expect(totalMinutes).toBe(600);
    expect(aiReadinessCourse.title).not.toMatch(/\bClass\s*(XI|11)\b/i);
  });

  it('validates exactly 352 AI Readiness questions (44 per module with strict per-type counts) + starter programming library', () => {
    const summary = validateQuestionBank();
    expect(summary.errors).toEqual([]);
    expect(summary.valid).toBe(true);
    expect(summary.totalAiReadinessQuestions).toBe(352);
    expect(summary.starterProgrammingCount).toBe(24);
    expect(summary.assessmentCount).toBe(8);
    expect(aiReadinessQuestionBank).toHaveLength(352);
    expect(starterProgrammingQuestions.length).toBeGreaterThanOrEqual(20);
    expect(aiReadinessAssessments).toHaveLength(8);
  });

  it('tags Supplemental GenAI / LLM enrichment questions explicitly', () => {
    const supplemental = aiReadinessQuestionBank.filter((q) => q.sourcePage === 'Supplemental');
    expect(supplemental.length).toBeGreaterThanOrEqual(4);
    for (const q of supplemental) {
      expect(q.title).toContain('[Supplemental]');
      expect(q.description).toContain('[Supplemental');
    }
  });
});
