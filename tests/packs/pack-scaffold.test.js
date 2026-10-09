'use strict';

/**
 * `surea11y-pack new` (src/pack-scaffold.js, templates/pack/): the pack it
 * writes, of either kind, is valid as generated, its own tests pass, its
 * rules pass the safe-dom lint rules, and its docs and examples hold, run as
 * its scripts run them.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { ESLint } = require('eslint');

const { scaffoldPack, namespaceOf, KINDS } = require('../../src/pack-scaffold.js');
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

// Its tests, run as its own npm test runs them, not as a subtest of this run.
function runItsTests(dir) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return execFileSync(process.execPath, ['--test', '--test-reporter=tap'], {
    cwd: dir,
    encoding: 'utf8',
    env
  });
}

const OWN = (ns) => [
  `${ns}-contrast-enhanced`,
  `${ns}-link-text-specific`,
  `${ns}-new-window-review`
];

test('the namespace is the package scope or its first word', () => {
  assert.equal(namespaceOf('@acme/a11y-pack'), 'acme');
  assert.equal(namespaceOf('city-web-rules'), 'city');
  assert.equal(namespaceOf('@Big-Co/rules'), 'big');
  assert.equal(namespaceOf('123'), 'pack');
});

test('a checklist pack: three rules, two profiles, three items', () => {
  const { dir, written } = newPack({ name: '@acme/a11y-pack' });
  assert.ok(written.includes('rules/manual/acme-new-window-review.js'));
  assert.ok(written.includes('.gitignore'));
  assert.ok(!written.some((f) => /__[A-Z]+__/.test(f)));
  const pack = require(dir);
  assert.deepEqual(checkPack(pack), []);
  const [d] = describePacks([pack]);
  assert.equal(d.name, '@acme/a11y-pack');
  assert.equal(d.title, 'Acme accessibility policy');
  assert.deepEqual(d.rules.concat(d.variants).sort(), OWN('acme'));
  assert.deepEqual(d.standard.profiles, ['acme-policy', 'acme-quick']);
  assert.deepEqual(d.standard.rollups, ['acme-images', 'acme-links', 'acme-contrast']);
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.private, true);
  assert.equal(pkg.peerDependencies['@surea11y/core'], `^${require('../../package.json').version}`);
  for (const file of written) {
    assert.doesNotMatch(fs.readFileSync(path.join(dir, file), 'utf8'), /__[A-Z]+__/, file);
  }
});

test('a standard pack: requirements, a rule map, two profiles', () => {
  const { dir, written } = newPack({ name: 'city-rules', namespace: 'city-web', kind: 'standard' });
  assert.ok(written.includes('requirements.js') && written.includes('rule-map.js'));
  const pack = require(dir);
  assert.deepEqual(checkPack(pack), []);
  const [d] = describePacks([pack]);
  assert.equal(d.standard.standard, 'City-web Standard');
  assert.deepEqual(d.standard.profiles, ['city-web-1.0', 'city-web-1.0-wcag']);
  assert.equal(d.standard.rollups.length, 6);
  for (const file of written) {
    assert.doesNotMatch(fs.readFileSync(path.join(dir, file), 'utf8'), /__[A-Z]+__/, file);
  }
});

for (const kind of KINDS) {
  test(`a ${kind} pack's tests pass and its rules pass the lint rules`, async () => {
    const { dir } = newPack({ name: '@acme/a11y-pack', kind });
    assert.match(runItsTests(dir), /# pass 12\n# fail 0/);
    const results = await new ESLint({ cwd: dir }).lintFiles(['.']);
    assert.deepEqual(
      results.flatMap((r) => r.messages.map((m) => `${r.filePath}: ${m.ruleId} ${m.message}`)),
      []
    );
    assert.ok(results.some((r) => r.filePath.endsWith('acme-new-window-review.js')));
  });
}

test('surea11y-pack new writes into a new folder only, of a known kind', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-new-'));
  const run = (...args) =>
    execFileSync(process.execPath, [BIN, 'new', ...args], {
      cwd: parent,
      encoding: 'utf8',
      stdio: 'pipe'
    });
  assert.match(run('web-pack'), /wrote web-pack\/index\.js/);
  assert.match(
    run('std-pack', '--kind', 'standard', '--title', 'Web Standard'),
    /wrote std-pack\/rule-map\.js/
  );
  assert.match(
    fs.readFileSync(path.join(parent, 'std-pack', 'index.js'), 'utf8'),
    /'Web Standard'/
  );
  const fails = (args, message) =>
    assert.throws(
      () => run(...args),
      (err) => err.status === 1 && message.test(err.stderr)
    );
  fails(['web-pack'], /web-pack is not empty/);
  fails(['other', '--namespace', 'wcag-x'], /namespace "wcag-x"/);
  fails(['other', '--kind', 'policy'], /kind "policy": one of checklist, standard/);
  // A namespace that starts core's rule ids, from the name or given.
  fails(
    ['aria-rules'],
    /namespace "aria" starts core's rule ids, such as aria-.* \(taken from the package name\): choose another with --namespace/
  );
  fails(['other', '--namespace', 'img'], /namespace "img" starts core's rule ids/);
  // A name npm would refuse.
  fails(
    ['other', '--name', 'My Pack'],
    /name "My Pack" must be a package name.*choose another with --name/
  );
  fails(['Shop Rules'], /name "Shop Rules" must be a package name.*\(taken from the folder\)/);
  assert.ok(!fs.existsSync(path.join(parent, 'aria-rules')));
});

test("a pack whose namespace is a core tag is valid as generated, and leaves core's rules alone", () => {
  const { runa11yCoreOnHtml } = require('../../src/testing.js');
  const html = '<!doctype html><html lang="en"><title>t</title><main><p>Text</p></main></html>';
  const ran = (engineOptions) =>
    runa11yCoreOnHtml(html, { engineOptions })
      .checksResults.map((c) => c.ruleId)
      .sort();
  const plain = ran({});
  for (const [name, namespace] of [
    ['@forms/policy', undefined],
    ['site-rules', 'best-practice']
  ]) {
    const { dir } = newPack({ name, namespace });
    const pack = require(path.join(dir, 'index.js'));
    assert.deepEqual(checkPack(pack), [], name);
    assert.deepEqual(ran({ packs: [pack] }), plain, name);
  }
});

for (const kind of KINDS) {
  test(
    `a ${kind} pack's examples give the outcomes their labels say, in Chromium`,
    { skip: chromium ? false : 'playwright not installed' },
    async () => {
      const { dir } = newPack({ name: '@acme/a11y-pack', kind });
      const pack = require(dir);
      assert.deepEqual((await packDocs(pack, { root: dir })).problems, []);
      const data = (file) =>
        JSON.parse(fs.readFileSync(path.join(dir, 'scripts', 'data', file), 'utf8'));
      assert.deepEqual(data('rule-examples-outcomes.json').disagreements, []);
      assert.deepEqual(data('rule-examples-coverage.json'), { missing: [], stale: [] });
      const catalog = fs.readFileSync(path.join(dir, 'docs', 'RULE_CATALOG.md'), 'utf8');
      assert.match(catalog, /## Profiles \(2\)/);
      assert.match(catalog, /## Rollups \((3|6)\)/);
    }
  );
}
