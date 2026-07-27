'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLI = path.join(__dirname, '..', 'bin', 'core.js');

function run(args, opts = {}) {
  try {
    const stdout = execFileSync('node', [CLI, ...args], { encoding: 'utf8', ...opts });
    return { stdout, status: 0 };
  } catch (err) {
    // execFileSync throws on non-zero exit; recover stdout/stderr/status instead of failing the test.
    return { stdout: err.stdout ? err.stdout.toString() : '', stderr: err.stderr ? err.stderr.toString() : '', status: err.status };
  }
}

let tmpDir;
test.before(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'));
});
test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('CLI: --help exits 0 and prints usage', () => {
  const { stdout, status } = run(['--help']);
  assert.equal(status, 0);
  assert.match(stdout, /Usage:/);
  assert.match(stdout, /surea11y scan/);
});

test('CLI: no arguments exits 2 (usage error) and still prints help', () => {
  const { stdout, status } = run([]);
  assert.equal(status, 2);
  assert.match(stdout, /Usage:/);
});

test('CLI: --version prints the package version', () => {
  const pkg = require('../package.json');
  const { stdout, status } = run(['--version']);
  assert.equal(status, 0);
  assert.equal(stdout.trim(), pkg.version);
});

test('CLI: scanning a missing file exits 2 with a clear error', () => {
  const { status, stderr } = run(['scan', path.join(tmpDir, 'does-not-exist.html')]);
  assert.equal(status, 2);
  assert.match(stderr, /No such file/);
});

test('CLI: scan exits 1 and reports fail occurrences for a page with real violations', () => {
  const file = path.join(tmpDir, 'has-failures.html');
  fs.writeFileSync(file, '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>');

  const { stdout, status } = run(['scan', file]);
  assert.equal(status, 1);
  assert.match(stdout, /img-alt-present/);
  assert.match(stdout, /FAIL/);
});

test('CLI: scan exits 0 for a page with no fail outcomes', () => {
  const file = path.join(tmpDir, 'clean.html');
  fs.writeFileSync(file, '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1></main></body></html>');

  const { status } = run(['scan', file, '--tags', 'wcag2a']);
  assert.equal(status, 0);
});

test('CLI: --json prints a parseable result with the expected top-level shape', () => {
  const file = path.join(tmpDir, 'json-check.html');
  fs.writeFileSync(file, '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>');

  const { stdout, status } = run(['scan', file, '--json']);
  assert.equal(status, 1);

  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.checksResults));
  assert.equal(result.engine.tag, 'a11ycore');
  const imgRule = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.equal(imgRule.outcome, 'fail');
});

test('CLI: --rules scopes the scan to only the requested rule IDs', () => {
  const file = path.join(tmpDir, 'rules-filter.html');
  fs.writeFileSync(file, '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"><button></button></body></html>');

  const { stdout, status } = run(['scan', file, '--json', '--rules', 'img-alt-present']);
  assert.equal(status, 1);

  const result = JSON.parse(stdout);
  assert.equal(result.checksResults.length, 1);
  assert.equal(result.checksResults[0].ruleId, 'img-alt-present');
});

test('CLI: unknown command exits 2', () => {
  const { status, stderr } = run(['not-a-real-command']);
  assert.equal(status, 2);
  assert.match(stderr, /unknown command/);
});
