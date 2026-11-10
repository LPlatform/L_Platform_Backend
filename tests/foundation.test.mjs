import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('backend trust boundaries and migration rules are documented', () => {
  for (const path of [
    'AGENTS.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'docs/deployment.md',
    'docs/integration/api-contracts.md',
  ]) {
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} exists`);
  }
  assert.match(read('AGENTS.md'), /Never run untrusted code in API processes/i);
  assert.match(read('AGENTS.md'), /Never automatically run destructive migrations in production/i);
  assert.match(read('docs/integration/api-contracts.md'), /versioned immutable artifact/i);
  assert.equal(read('.nvmrc').trim(), '24.22.1');
});

test('workflow actions use full commit SHAs', () => {
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const contents = read(`.github/workflows/${file}`);
    for (const line of contents.split(/\r?\n/).filter((value) => /^\s+uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/, `${file}: ${line.trim()}`);
    }
  }
});

test('product and migration jobs are separate from bootstrap smoke tests', () => {
  assert.match(read('.github/workflows/ci.yml'), /name: bootstrap-smoke/);
  assert.match(read('.github/workflows/ci.yml'), /name: backend-product-ci/);
  assert.match(
    read('.github/workflows/api-tests.yml'),
    /if: needs\.readiness\.outputs\.product-configured == 'true'/,
  );
  assert.match(
    read('.github/workflows/database-tests.yml'),
    /if: needs\.readiness\.outputs\.product-configured == 'true'/,
  );
  assert.match(
    read('.github/workflows/docker-build.yml'),
    /lplatform-backend:\$\{\{ github\.sha \}\}/,
  );
  assert.doesNotMatch(read('.github/workflows/release.yml'), /lplatform-backend:release/);
  assert.match(read('.github/workflows/release.yml'), /existing release/i);
});
