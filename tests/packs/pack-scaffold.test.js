'use strict';

/**
 * `surea11y-pack new` (src/pack-scaffold.js): the pack it writes is valid,
 * its own tests pass, its rules pass the safe-dom lint rules, and its docs
 * and examples hold, run as its scripts run them.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ESLint } = require('eslint');

const { scaffoldPack, namespaceOf } = require('../../src/pack-scaffold.js');
const { checkPack, describePacks } = require('../../src/pack.js');
const { packDocs } = require('../../src/pack-docs.js');

const ROOT = path.join(__dirname, '..', '..');
const BIN = path.join(ROOT, 'bin', 'surea11y-pack.js');

let chromium = null;
try {
  ({ chromium } = require('playwright'));
} catch {}

// A new pack in a folder of its own, with core installed in it.
function newPack(options) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pack-new-')), 'my-pack');
  const written = scaffoldPack(dir, options);
  fs.mkdirSync(path.join(dir, 'node_modules', '@surea11y'), { recursive: true });
  fs.symlinkSync(ROOT, path.join(dir, 'node_modules', '@surea11y', 'core'), 'dir');
  return { dir, written };
}

test('the namespace is the package scope or its first word', () => {
  assert.equal(namespaceOf('@acme/a11y-pack'), 'acme');
  assert.equal(namespaceOf('city-web-rules'), 'city');
  assert.equal(namespaceOf('@Big-Co/rules'), 'big');
  assert.equal(namespaceOf('123'), 'pack');
});

test('the new pack is valid and says what it brings', () => {
  const { dir, written } = newPack({ name: '@acme/a11y-pack' });
  assert.ok(written.includes('rules/automatic/acme-link-text-specific.js'));
  const pack = require(dir);
  assert.deepEqual(checkPack(pack), []);
  const [d] = describePacks([pack]);
  assert.equal(d.name, '@acme/a11y-pack');
  assert.equal(d.namespace, 'acme');
  assert.deepEqual(d.rules, ['acme-link-text-specific']);
  assert.deepEqual(d.locales, ['en']);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.private, true);
  assert.equal(pkg.peerDependencies['@surea11y/core'], `^${require('../../package.json').version}`);
});

test('its tests pass and its rules pass the lint rules', async () => {
  const { dir } = newPack({ name: 'city-rules', namespace: 'city-web' });
  // Run as its own npm test runs, not as a subtest of this run.
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const out = execFileSync(process.execPath, ['--test', '--test-reporter=tap'], {
    cwd: dir,
    encoding: 'utf8',
    env
  });
  assert.match(out, /# pass 3\n# fail 0/);
  const eslint = new ESLint({ cwd: dir });
  const results = await eslint.lintFiles(['.']);
  assert.deepEqual(
    results.flatMap((r) => r.messages.map((m) => `${r.filePath}: ${m.ruleId} ${m.message}`)),
    []
  );
  assert.ok(results.some((r) => r.filePath.endsWith('city-web-link-text-specific.js')));
});

test('surea11y-pack new writes into a new folder only', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-new-'));
  const run = (...args) =>
    execFileSync(process.execPath, [BIN, 'new', ...args], {
      cwd: parent,
      encoding: 'utf8',
      stdio: 'pipe'
    });
  assert.match(run('web-pack'), /wrote web-pack\/index\.js/);
  assert.throws(
    () => run('web-pack'),
    (err) => err.status === 1 && /web-pack is not empty/.test(err.stderr)
  );
  assert.throws(
    () => run('other', '--namespace', 'wcag-x'),
    (err) => err.status === 1 && /namespace "wcag-x"/.test(err.stderr)
  );
});

test(
  'its examples give the outcomes their labels say, in Chromium',
  { skip: chromium ? false : 'playwright not installed' },
  async () => {
    const { dir } = newPack({ name: '@acme/a11y-pack' });
    const pack = require(dir);
    assert.deepEqual((await packDocs(pack, { root: dir })).problems, []);
    const record = JSON.parse(
      fs.readFileSync(path.join(dir, 'scripts', 'data', 'rule-examples-outcomes.json'), 'utf8')
    );
    assert.deepEqual(record.disagreements, []);
    const coverage = JSON.parse(
      fs.readFileSync(path.join(dir, 'scripts', 'data', 'rule-examples-coverage.json'), 'utf8')
    );
    assert.deepEqual(coverage, { missing: [], stale: [] });
  }
);
