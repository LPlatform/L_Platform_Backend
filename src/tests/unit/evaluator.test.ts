import { describe, it, expect } from 'vitest';
import { evaluateSubmission, TestCasePayload } from '../../services/evaluator.service.js';

describe('Submission Code Evaluator', () => {
  it('correctly compiles, executes, and grades Python code', async () => {
    const pythonCode = `
import sys
line = sys.stdin.read().strip()
if line:
    a, b = map(int, line.split())
    print(a + b)
`;

    const testCases: TestCasePayload[] = [
      {
        id: 'tc-1',
        input: '3 5\n',
        expectedOutput: '8\n',
        isHidden: false,
        isSample: true,
        timeLimitMs: 3000,
        memoryLimitMb: 128,
      },
      {
        id: 'tc-2',
        input: '100 200\n',
        expectedOutput: '300\n',
        isHidden: true,
        isSample: false,
        timeLimitMs: 3000,
        memoryLimitMb: 128,
      },
    ];

    const result = await evaluateSubmission(pythonCode, 'PYTHON', testCases);

    expect(result.status).toBe('COMPLETED');
    expect(result.totalTestCases).toBe(2);
    expect(result.passedTestCases).toBe(2);
    expect(result.score).toBe(100);
    expect(result.results[0].status).toBe('PASS');
    expect(result.results[1].status).toBe('PASS');
  });

  it('detects incorrect outputs and assigns partial/failing scores', async () => {
    const buggyCode = `
import sys
print(42)
`;

    const testCases: TestCasePayload[] = [
      {
        id: 'tc-1',
        input: '1 1\n',
        expectedOutput: '2\n',
        isHidden: false,
        isSample: true,
        timeLimitMs: 2000,
        memoryLimitMb: 128,
      },
      {
        id: 'tc-2',
        input: '40 2\n',
        expectedOutput: '42\n',
        isHidden: false,
        isSample: true,
        timeLimitMs: 2000,
        memoryLimitMb: 128,
      },
    ];

    const result = await evaluateSubmission(buggyCode, 'PYTHON', testCases);

    expect(result.status).toBe('COMPLETED');
    expect(result.totalTestCases).toBe(2);
    expect(result.passedTestCases).toBe(1);
    expect(result.score).toBe(50);
    expect(result.results[0].status).toBe('FAIL');
    expect(result.results[1].status).toBe('PASS');
  });

  it('handles runtime exceptions gracefully without crashing', async () => {
    const crashingCode = `
import sys
x = 1 / 0
`;

    const testCases: TestCasePayload[] = [
      {
        id: 'tc-1',
        input: '',
        expectedOutput: 'anything',
        isHidden: false,
        isSample: true,
        timeLimitMs: 2000,
        memoryLimitMb: 128,
      },
    ];

    const result = await evaluateSubmission(crashingCode, 'PYTHON', testCases);

    expect(result.status).toBe('COMPLETED');
    expect(result.results[0].status).toBe('RUNTIME_ERROR');
    expect(result.results[0].errorMessage).toContain('ZeroDivisionError');
    expect(result.score).toBe(0);
  });
});

