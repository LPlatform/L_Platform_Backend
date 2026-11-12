export type BankQuestionType =
  | 'SINGLE_MCQ'
  | 'MULTI_SELECT'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'SHORT_ANSWER'
  | 'LONG_CASE'
  | 'PRACTICAL'
  | 'CODE'
  | 'CONCEPTUAL'
  | 'CASE_STUDY'
  | 'PROJECT'
  | 'FILE_SUBMISSION';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface BankOptionSpec {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BankQuestionSpec {
  id: string;
  courseId: string;
  courseModuleId: string | null;
  lessonId?: string | null;
  questionType: BankQuestionType;
  title: string;
  description: string;
  topic: string;
  difficulty: DifficultyLevel;
  marks: number;
  estimatedMinutes: number;
  sourcePage: string;
  sourceReference: string;
  learningObjective: string;
  explanation: string;
  options?: BankOptionSpec[];
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  correctBoolean?: boolean;
  rubric?: {
    criteria: string[];
    expectedPoints: string[];
    sampleAnswer?: string;
  };
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  supportedLanguages?: string[];
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isSample: boolean;
    isHidden: boolean;
  }>;
}

export interface RawModuleQuestionInput {
  slug: string;
  type:
    | 'SINGLE_MCQ'
    | 'MULTI_SELECT'
    | 'TRUE_FALSE'
    | 'FILL_BLANK'
    | 'SHORT_ANSWER'
    | 'LONG_CASE'
    | 'PRACTICAL';
  title: string;
  prompt: string;
  topic: string;
  difficulty: DifficultyLevel;
  sourcePage: string;
  objective: string;
  explanation: string;
  marks?: number;
  estimatedMinutes?: number;
  lessonId?: string;
  supplemental?: boolean;
  options?: Array<{ text: string; correct?: boolean }>;
  acceptedAnswers?: string[];
  correctBoolean?: boolean;
  expectedPoints?: string[];
  sampleAnswer?: string;
}

export function buildModuleQuestions(
  moduleId: string,
  unitNumber: number,
  items: RawModuleQuestionInput[],
): BankQuestionSpec[] {
  return items.map((item, idx) => {
    const id = `qst-ai-m${unitNumber}-${String(idx + 1).padStart(2, '0')}-${item.slug}`;
    const defaultMarks =
      item.marks ??
      (item.type === 'SINGLE_MCQ' || item.type === 'TRUE_FALSE' || item.type === 'FILL_BLANK'
        ? 1
        : item.type === 'MULTI_SELECT'
          ? 2
          : item.type === 'SHORT_ANSWER'
            ? 3
            : 5);
    const defaultMins =
      item.estimatedMinutes ??
      (item.type === 'SINGLE_MCQ' || item.type === 'TRUE_FALSE' || item.type === 'FILL_BLANK'
        ? 2
        : item.type === 'MULTI_SELECT'
          ? 3
          : item.type === 'SHORT_ANSWER'
            ? 5
            : 10);

    let options: BankOptionSpec[] | undefined;
    if (item.type === 'TRUE_FALSE') {
      const trueCorrect = item.correctBoolean === true;
      options = [
        { id: `${id}-opt-1`, text: 'True', isCorrect: trueCorrect },
        { id: `${id}-opt-2`, text: 'False', isCorrect: !trueCorrect },
      ];
    } else if (item.options) {
      options = item.options.map((opt, oIdx) => ({
        id: `${id}-opt-${oIdx + 1}`,
        text: opt.text,
        isCorrect: Boolean(opt.correct),
      }));
    }

    const refLabel = item.supplemental
      ? `Supplemental GenAI Readiness Extension (${item.sourcePage})`
      : `CBSE AI Student Handbook (Code 843), Printed p.${item.sourcePage}`;

    return {
      id,
      courseId: 'crs-ai-readiness-001',
      courseModuleId: moduleId,
      lessonId: item.lessonId ?? `m${unitNumber}-l1`,
      questionType: item.type,
      title: item.title,
      description: item.prompt,
      topic: item.topic,
      difficulty: item.difficulty,
      marks: defaultMarks,
      estimatedMinutes: defaultMins,
      sourcePage: item.sourcePage,
      sourceReference: refLabel,
      learningObjective: item.objective,
      explanation: item.explanation,
      options,
      acceptedAnswers: item.acceptedAnswers,
      caseSensitive: false,
      correctBoolean: item.correctBoolean,
      rubric:
        item.type === 'SHORT_ANSWER' || item.type === 'LONG_CASE' || item.type === 'PRACTICAL'
          ? {
              criteria: [
                'Concept accuracy relative to module principles',
                'Clear justification and specific domain example',
                'Awareness of human oversight, caveats, or edge cases',
              ],
              expectedPoints: item.expectedPoints ?? [],
              sampleAnswer: item.sampleAnswer,
            }
          : undefined,
    };
  });
}

export function buildQuestionAnswerKey(q: BankQuestionSpec): Record<string, unknown> {
  if (q.questionType === 'SINGLE_MCQ' || q.questionType === 'MULTI_SELECT') {
    const opts = q.options ?? [];
    return {
      options: opts.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      correctOptionIds: opts.filter((o) => o.isCorrect).map((o) => o.id),
    };
  }
  if (q.questionType === 'TRUE_FALSE') {
    const opts = q.options ?? [];
    return {
      options: opts.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
      correctOptionIds: opts.filter((o) => o.isCorrect).map((o) => o.id),
      correctValue: q.correctBoolean ?? false,
    };
  }
  if (q.questionType === 'FILL_BLANK') {
    return {
      acceptedAnswers: q.acceptedAnswers ?? [],
      caseSensitive: Boolean(q.caseSensitive),
    };
  }
  if (q.rubric) {
    return {
      rubric: q.rubric.criteria.join(' | '),
      expectedPoints: q.rubric.expectedPoints,
      sampleAnswer: q.rubric.sampleAnswer ?? '',
    };
  }
  return {};
}
