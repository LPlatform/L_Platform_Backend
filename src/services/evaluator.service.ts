import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { v4 as uuidv4 } from 'uuid';

export interface TestCasePayload {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isSample: boolean;
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface TestCaseResult {
  testCaseId: string;
  status: 'PASS' | 'FAIL' | 'TIMEOUT' | 'MEMORY_LIMIT' | 'RUNTIME_ERROR' | 'COMPILE_ERROR';
  actualOutput: string | null;
  executionTimeMs: number;
  memoryUsedKb: number;
  errorMessage: string | null;
}

export interface EvaluationResult {
  status: 'COMPLETED' | 'ERROR';
  score: number;
  totalTestCases: number;
  passedTestCases: number;
  results: TestCaseResult[];
}

function normalizeOutput(str: string): string {
  return str.replace(/\r\n/g, '\n').trim();
}

async function runProcessWithTimeout(
  command: string,
  args: string[],
  cwd: string,
  input: string,
  timeoutMs: number,
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {}
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      // Cap stdout size to 1MB
      if (stdout.length > 1024 * 1024) {
        try {
          child.kill('SIGKILL');
        } catch {}
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        timedOut: false,
      });
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode,
        executionTimeMs: Date.now() - startTime,
        timedOut,
      });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}

export async function evaluateSubmission(
  code: string,
  language: 'PYTHON' | 'JAVA' | 'CPP',
  testCases: TestCasePayload[],
): Promise<EvaluationResult> {
  const tmpDir = path.join(os.tmpdir(), `lplat_exec_${uuidv4()}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const results: TestCaseResult[] = [];
  let passedCount = 0;

  try {
    let runCommand = '';
    let runArgs: string[] = [];

    if (language === 'PYTHON') {
      const codePath = path.join(tmpDir, 'solution.py');
      await fs.writeFile(codePath, code, 'utf8');
      runCommand = 'python';
      runArgs = [codePath];
    } else if (language === 'JAVA') {
      const codePath = path.join(tmpDir, 'Main.java');
      await fs.writeFile(codePath, code, 'utf8');

      // Compile Java
      const compileRes = await runProcessWithTimeout('javac', ['Main.java'], tmpDir, '', 10000);
      if (compileRes.exitCode !== 0) {
        for (const tc of testCases) {
          results.push({
            testCaseId: tc.id,
            status: 'COMPILE_ERROR',
            actualOutput: null,
            executionTimeMs: compileRes.executionTimeMs,
            memoryUsedKb: 0,
            errorMessage: compileRes.stderr || 'Compilation failed',
          });
        }
        return {
          status: 'ERROR',
          score: 0,
          totalTestCases: testCases.length,
          passedTestCases: 0,
          results,
        };
      }

      runCommand = 'java';
      runArgs = ['-cp', tmpDir, 'Main'];
    } else if (language === 'CPP') {
      const codePath = path.join(tmpDir, 'solution.cpp');
      const exeName = process.platform === 'win32' ? 'solution.exe' : 'solution';
      const exePath = path.join(tmpDir, exeName);
      await fs.writeFile(codePath, code, 'utf8');

      // Compile C++
      const compileRes = await runProcessWithTimeout(
        'g++',
        ['-O2', 'solution.cpp', '-o', exeName],
        tmpDir,
        '',
        10000,
      );
      if (compileRes.exitCode !== 0) {
        for (const tc of testCases) {
          results.push({
            testCaseId: tc.id,
            status: 'COMPILE_ERROR',
            actualOutput: null,
            executionTimeMs: compileRes.executionTimeMs,
            memoryUsedKb: 0,
            errorMessage: compileRes.stderr || 'Compilation failed',
          });
        }
        return {
          status: 'ERROR',
          score: 0,
          totalTestCases: testCases.length,
          passedTestCases: 0,
          results,
        };
      }

      runCommand = exePath;
      runArgs = [];
    }

    // Run test cases sequentially
    for (const tc of testCases) {
      const timeoutMs = tc.timeLimitMs || 2000;
      const runRes = await runProcessWithTimeout(runCommand, runArgs, tmpDir, tc.input, timeoutMs);

      if (runRes.timedOut) {
        results.push({
          testCaseId: tc.id,
          status: 'TIMEOUT',
          actualOutput: null,
          executionTimeMs: timeoutMs,
          memoryUsedKb: 0,
          errorMessage: 'Time limit exceeded',
        });
      } else if (runRes.exitCode !== 0) {
        results.push({
          testCaseId: tc.id,
          status: 'RUNTIME_ERROR',
          actualOutput: runRes.stdout,
          executionTimeMs: runRes.executionTimeMs,
          memoryUsedKb: 0,
          errorMessage: runRes.stderr || 'Runtime error occurred',
        });
      } else {
        const normActual = normalizeOutput(runRes.stdout);
        const normExpected = normalizeOutput(tc.expectedOutput);
        const isPass = normActual === normExpected;

        if (isPass) passedCount++;

        results.push({
          testCaseId: tc.id,
          status: isPass ? 'PASS' : 'FAIL',
          actualOutput: runRes.stdout,
          executionTimeMs: runRes.executionTimeMs,
          memoryUsedKb: 0,
          errorMessage: isPass ? null : 'Output does not match expected output',
        });
      }
    }

    const totalCount = testCases.length;
    const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

    return {
      status: 'COMPLETED',
      score,
      totalTestCases: totalCount,
      passedTestCases: passedCount,
      results,
    };
  } finally {
    // Cleanup tmp dir
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
