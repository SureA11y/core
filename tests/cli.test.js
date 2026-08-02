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
    return {
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : '',
      status: err.status
    };
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
  assert.match(stdout, /--write-baseline/);
  assert.match(stdout, /--baseline/);
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
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );

  const { stdout, status } = run(['scan', file]);
  assert.equal(status, 1);
  assert.match(stdout, /img-alt-present/);
  assert.match(stdout, /FAIL/);
});

test('CLI: scan exits 0 for a page with no fail outcomes', () => {
  const file = path.join(tmpDir, 'clean.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1></main></body></html>'
  );

  const { status } = run(['scan', file, '--tags', 'wcag2a']);
  assert.equal(status, 0);
});

test('CLI: --json prints a parseable result with the expected top-level shape', () => {
  const file = path.join(tmpDir, 'json-check.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );

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
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"><button></button></body></html>'
  );

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

test('CLI: --write-baseline writes a well-formed baseline file and exits 0 despite a fail', () => {
  const file = path.join(tmpDir, 'baseline-write.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-write.json');

  const { status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--write-baseline',
    baselinePath
  ]);
  assert.equal(status, 0);

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  assert.equal(baseline.version, 1);
  assert.equal(baseline.entries.length, 1);
  assert.equal(baseline.entries[0].ruleId, 'img-alt-present');
  assert.match(baseline.entries[0].html, /<img/);
});

test('CLI: --baseline against an unchanged page treats every occurrence as known and exits 0', () => {
  const file = path.join(tmpDir, 'baseline-known.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-known.json');

  run(['scan', file, '--rules', 'img-alt-present', '--write-baseline', baselinePath]);
  const { status, stdout } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--baseline',
    baselinePath
  ]);

  assert.equal(status, 0);
  assert.match(stdout, /baseline: 1 known, 0 new/);
});

test('CLI: --baseline exits 1 when a new violation appears that is not in the baseline', () => {
  const file = path.join(tmpDir, 'baseline-new.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-new.json');
  run(['scan', file, '--rules', 'img-alt-present', '--write-baseline', baselinePath]);

  // Add a second, genuinely new violation (different src => different html snippet).
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"><img src="y.png"></body></html>'
  );
  const { status, stdout } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--baseline',
    baselinePath
  ]);

  assert.equal(status, 1);
  assert.match(stdout, /baseline: 1 known, 1 new/);
  assert.match(stdout, /NEW \(not in baseline/);
});

test('CLI: --baseline pointing at a missing file exits 2 with a clear error', () => {
  const file = path.join(tmpDir, 'baseline-missing.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );

  const { status, stderr } = run([
    'scan',
    file,
    '--baseline',
    path.join(tmpDir, 'does-not-exist.json')
  ]);
  assert.equal(status, 2);
  assert.match(stderr, /Could not read baseline file/);
});

test('CLI: --baseline pointing at a file with invalid JSON exits 2 with a clear error', () => {
  const file = path.join(tmpDir, 'baseline-badjson.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-badjson.json');
  fs.writeFileSync(baselinePath, '{ not valid json');

  const { status, stderr } = run(['scan', file, '--baseline', baselinePath]);
  assert.equal(status, 2);
  assert.match(stderr, /not valid JSON/);
});

test('CLI: --baseline pointing at a file with an unsupported/missing version exits 2 with a clear error', () => {
  const file = path.join(tmpDir, 'baseline-badversion.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-badversion.json');
  fs.writeFileSync(baselinePath, JSON.stringify({ entries: [] })); // no version field

  const { status, stderr } = run(['scan', file, '--baseline', baselinePath]);
  assert.equal(status, 2);
  assert.match(stderr, /not a supported baseline/);
});

test('CLI: --baseline and --write-baseline together exits 2', () => {
  const file = path.join(tmpDir, 'baseline-combo.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );

  const { status, stderr } = run([
    'scan',
    file,
    '--baseline',
    'a.json',
    '--write-baseline',
    'b.json'
  ]);
  assert.equal(status, 2);
  assert.match(stderr, /cannot be used together/);
});

test('CLI: --json + --write-baseline augments the printed result with a write-mode baseline block', () => {
  const file = path.join(tmpDir, 'baseline-write-json.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-write-json.json');

  const { stdout, status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--write-baseline',
    baselinePath,
    '--json'
  ]);
  assert.equal(status, 0);

  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.checksResults));
  assert.equal(result.baseline.mode, 'write');
  assert.equal(result.baseline.path, baselinePath);
  assert.equal(result.baseline.entries, 1);
});

test('CLI: --json + --baseline augments the printed result with a baseline block', () => {
  const file = path.join(tmpDir, 'baseline-json.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'baseline-json.json');
  run(['scan', file, '--rules', 'img-alt-present', '--write-baseline', baselinePath]);

  const { stdout, status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--baseline',
    baselinePath,
    '--json'
  ]);
  assert.equal(status, 0);

  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.checksResults));
  assert.equal(result.baseline.mode, 'check');
  assert.equal(result.baseline.knownCount, 1);
  assert.equal(result.baseline.newCount, 0);
});

test('CLI: --html writes a self-contained HTML report to the given path', () => {
  const file = path.join(tmpDir, 'report-source.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const reportPath = path.join(tmpDir, 'report-output.html');

  const { status, stderr } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--html',
    reportPath
  ]);
  assert.equal(status, 1); // --html doesn't change gating: the scan still has a real fail
  assert.match(stderr, /Wrote HTML report to/);

  const report = fs.readFileSync(reportPath, 'utf8');
  assert.match(report, /^<!doctype html>/);
  assert.match(report, /img-alt-present/);
  assert.doesNotMatch(report, /\ssrc=["']https?:/);
});

test('CLI: --html works alongside --json (both artifacts produced from the same scan)', () => {
  const file = path.join(tmpDir, 'report-both.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const reportPath = path.join(tmpDir, 'report-both-output.html');

  const { stdout, status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--html',
    reportPath,
    '--json'
  ]);
  assert.equal(status, 1);

  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.checksResults));
  assert.ok(fs.existsSync(reportPath));
});

test('CLI: --sarif writes a well-formed SARIF 2.1.0 log with an "error"-level result', () => {
  const file = path.join(tmpDir, 'sarif-source.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const sarifPath = path.join(tmpDir, 'sarif-output.sarif');

  const { status, stderr } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--sarif',
    sarifPath
  ]);
  assert.equal(status, 1); // --sarif doesn't change gating: the scan still has a real fail
  assert.match(stderr, /Wrote SARIF report to/);

  const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf8'));
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs[0].tool.driver.name, 'surea11y');
  assert.equal(sarif.runs[0].results[0].ruleId, 'img-alt-present');
  assert.equal(sarif.runs[0].results[0].level, 'error');
});

test('CLI: --sarif combined with --baseline omits already-known fail occurrences', () => {
  const file = path.join(tmpDir, 'sarif-baseline.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const baselinePath = path.join(tmpDir, 'sarif-baseline.json');
  const sarifPath = path.join(tmpDir, 'sarif-baseline.sarif');

  run(['scan', file, '--rules', 'img-alt-present', '--write-baseline', baselinePath]);
  const { status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--baseline',
    baselinePath,
    '--sarif',
    sarifPath
  ]);
  assert.equal(status, 0); // known, not new -- baseline gating still passes

  const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf8'));
  assert.equal(sarif.runs[0].results.length, 0);
});

test('CLI: --sarif works alongside --html and --json (all three artifacts from the same scan)', () => {
  const file = path.join(tmpDir, 'sarif-multi.html');
  fs.writeFileSync(
    file,
    '<!doctype html><html lang="en"><head><title>T</title></head><body><img src="x.png"></body></html>'
  );
  const sarifPath = path.join(tmpDir, 'sarif-multi.sarif');
  const reportPath = path.join(tmpDir, 'sarif-multi.html.report');

  const { stdout, status } = run([
    'scan',
    file,
    '--rules',
    'img-alt-present',
    '--sarif',
    sarifPath,
    '--html',
    reportPath,
    '--json'
  ]);
  assert.equal(status, 1);

  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.checksResults));
  assert.ok(fs.existsSync(sarifPath));
  assert.ok(fs.existsSync(reportPath));
});
