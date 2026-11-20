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
const { proceduresFor } = require('../../src/index.js');

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

// The kinds that bring example rules; a derived pack has none (below).
const RULE_KINDS = KINDS.filter((k) => k !== 'derived');

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
  // Every requirement says how a person assesses it (procedures.js): one
  // restating a criterion takes its procedures, one replaces a facet's with
  // its own, and two give facets of their own.
  assert.ok(written.includes('procedures.js'));
  const read = (id) => proceduresFor(id, { packs: [pack], standard: 'city-web' });
  for (const id of ['1', '2', '3', '4', '5', '6']) assert.equal(read(id).complete, true, id);
  // Each is named by its title in requirements.js, whatever its form.
  assert.deepEqual(
    ['1', '3', '6'].map((id) => read(id).title),
    ['Images have a text alternative', 'Links that open a new window say so', 'Pages have a title']
  );
  assert.equal(read('1').wcag, '1.1.1');
  assert.deepEqual(
    read('1').facets.map((f) => f.id),
    proceduresFor('1.1.1').facets.map((f) => f.id)
  );
  assert.match(
    read('1').facets.find((f) => f.procedure).procedure.failWhen,
    /fails City-web Standard 1\b/
  );
  assert.deepEqual(
    read('6')
      .facets.filter((f) => f.procedureFrom)
      .map((f) => [f.id, f.procedureFrom]),
    [['page-title-descriptive', 'city-rules']]
  );
  assert.deepEqual(
    read('5').facets.map((f) => f.id),
    ['heading-levels-in-order']
  );
});

// The generated tests, per kind: a standard also checks the WCAG version its
// profile is judged by.
const TEST_COUNT = { checklist: 12, standard: 19 };

for (const kind of RULE_KINDS) {
  test(`a ${kind} pack's tests pass and its rules pass the lint rules`, async () => {
    const { dir } = newPack({ name: '@acme/a11y-pack', kind });
    assert.match(runItsTests(dir), new RegExp(`# pass ${TEST_COUNT[kind]}\\n# fail 0`));
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
  fails(['other', '--kind', 'policy'], /kind "policy": one of checklist, standard, derived/);
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
  fails(['other', '--name', ' '], /name must be a non-empty string: choose another with --name/);
  // A pack every scan would skip: its standard named as one of core's is.
  fails(
    ['other', '--title', 'WCAG'],
    /the pack would not be valid: .*its standard is named "WCAG", as one of core's is/
  );
  fails(
    ['other', '--kind', 'standard', '--title', 'EN 301 549'],
    /the pack would not be valid: .*its standard is named "EN 301 549", as one of core's is/
  );
  assert.ok(!fs.existsSync(path.join(parent, 'aria-rules')));
  assert.ok(!fs.existsSync(path.join(parent, 'other')));
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

for (const kind of RULE_KINDS) {
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

test('a title is written as each file reads it, so any title gives a pack that loads', () => {
  const titles = [
    "Bob's Policy",
    'Back\\slash "quoted" */ end',
    "x');globalThis.__titleRan = true;('",
    // Read as the title, not as the template's tokens.
    'Policy __NAMESPACE__ __KEY__ __PACKAGE__ __CORE__ __TITLE__'
  ];
  for (const kind of RULE_KINDS) {
    for (const title of titles) {
      const { dir } = newPack({ name: 'titled', kind, title });
      const pack = require(path.join(dir, 'index.js'));
      assert.equal(globalThis.__titleRan, undefined, title);
      assert.equal(kind === 'standard' ? pack.standard.standard : pack.title, title, title);
      for (const file of fs.readdirSync(path.join(dir, 'i18n'))) {
        JSON.parse(fs.readFileSync(path.join(dir, 'i18n', file), 'utf8'));
      }
    }
  }
  // The standard's own tests read the title too.
  const { dir } = newPack({ name: 'titled', kind: 'standard', title: titles[1] });
  assert.match(runItsTests(dir), /# fail 0/);
  assert.throws(
    () => newPack({ name: 'titled', title: 'two\nlines' }),
    /one line, with no control characters/
  );
});

// Its messages read their placeholders as core's do ({{name}}), so a
// generated pack's summary names the link rather than showing "{name}".
test("a generated pack's messages fill in their placeholders", () => {
  const { runa11yCoreOnHtml } = require('../../src/testing.js');
  for (const kind of RULE_KINDS) {
    const { dir } = newPack({ name: '@acme/a11y-pack', kind });
    const pack = require(dir);
    const r = runa11yCoreOnHtml(
      '<!doctype html><html lang="en"><head><title>t</title></head><body><main><a href="/x">Click here</a></main></body></html>',
      { engineOptions: { packs: [pack] }, runOnly: ['acme-link-text-specific'] }
    );
    const c = r.checksResults.find((x) => x.ruleId === 'acme-link-text-specific');
    assert.equal(c.outcome, 'fail', kind);
    assert.equal(c.occurrences[0].summary, 'The link is named only "click here".', kind);
  }
});

// A base pack with its standard in core's data format, installed in a folder
// that a derived pack is generated in: one requirement checked by a core
// rule and one by the base's own rule.
function baseWorkspace() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-derived-'));
  const modules = path.join(work, 'node_modules');
  fs.mkdirSync(path.join(modules, '@surea11y'), { recursive: true });
  fs.symlinkSync(ROOT, path.join(modules, '@surea11y', 'core'), 'dir');
  const [major, minor] = require('../../package.json').version.split('.');
  const base = path.join(modules, '@base', 'std-pack');
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(
    path.join(base, 'package.json'),
    JSON.stringify({ name: '@base/std-pack', version: '2.1.0', main: 'index.js' })
  );
  fs.writeFileSync(
    path.join(base, 'index.js'),
    `'use strict';
const { definePack, standardFromData } = require('@surea11y/core/pack');
const DATA = {
  format: 'surea11y-standard/1', key: 'base', standard: 'Base Standard', lang: 'en',
  options: { ruleMapped: true },
  versions: [{ version: '2.0', wcagVersion: '2.2' }],
  data: { '2.0': {
    requirements: {
      1: { title: 'Pages have a title', wcagSc: ['2.4.2'] },
      2: { title: 'Pages have a main zone', wcagSc: [] }
    },
    ruleMap: {
      'page-title-present': { requirements: ['1'] },
      'base-main-present': { requirements: ['2'] }
    }
  } },
  profiles: { 'base-2.0': { version: '2.0', tags: ['base'], mappedRules: true, wcagVersion: '2.2' } }
};
module.exports = definePack({
  name: '@base/std-pack', version: '2.1.0', namespace: 'base', core: '~${major}.${minor}.0',
  rules: [{
    id: 'base-main-present',
    meta: { title: 'The page has a main zone', tags: ['base'], wcagSc: [] },
    runInPage: (ctx) => ctx.document.querySelector('main')
      ? { outcome: 'pass', occurrences: [] }
      : { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }
  }],
  standard: standardFromData(DATA)
});
`
  );
  return work;
}

test('a derived pack: the base as it is, its rules used, its own tests passing', async () => {
  const work = baseWorkspace();
  const dir = path.join(work, 'city-std');
  const written = scaffoldPack(dir, {
    name: '@city/std',
    kind: 'derived',
    from: '@base/std-pack',
    title: 'City Standard',
    cwd: work
  });
  assert.deepEqual(written, [
    '.gitignore',
    'README.md',
    'eslint.config.js',
    'index.js',
    'package.json',
    'standard-data.js',
    'tests/standard.test.js'
  ]);
  for (const file of written) {
    assert.doesNotMatch(fs.readFileSync(path.join(dir, file), 'utf8'), /__[A-Z]+__/, file);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const [major, minor] = require('../../package.json').version.split('.');
  assert.deepEqual(pkg.dependencies, { '@base/std-pack': '~2.1.0' });
  assert.equal(pkg.peerDependencies['@surea11y/core'], `~${major}.${minor}.0`);

  const base = require(path.join(work, 'node_modules', '@base', 'std-pack'));
  const pack = require(dir);
  assert.deepEqual(checkPack(pack), []);
  const [d] = describePacks([pack]);
  assert.deepEqual(d.uses, ['@base/std-pack@2.1.0']);
  assert.equal(pack.standard.standard, 'City Standard');

  // Its profile runs the base pack's rule as the derived map links it.
  const { runa11yCoreOnHtml } = require('../../src/testing.js');
  const r = runa11yCoreOnHtml(
    '<!doctype html><html lang="en"><head><title>t</title></head><body><p>x</p></body></html>',
    { engineOptions: { packs: [base, pack], profile: 'city-1.0' } }
  );
  assert.equal(r.skippedPacks, undefined);
  assert.equal(r.rulesResults.find((x) => x.ruleId === 'city-1.0-2').outcome, 'fail');

  assert.match(runItsTests(dir), /# pass 4\n# fail 0/);
  const lint = await new ESLint({ cwd: dir }).lintFiles(['.']);
  assert.deepEqual(
    lint.flatMap((x) => x.messages.map((m) => `${x.filePath}: ${m.ruleId} ${m.message}`)),
    []
  );
});

test('a derived pack needs an installed base whose standard is data, and --from is only for it', () => {
  const work = baseWorkspace();
  const at = (name) => path.join(work, name);
  assert.throws(
    () => scaffoldPack(at('a'), { kind: 'derived', cwd: work }),
    /needs the pack it is built on: --from <package name>/
  );
  assert.throws(
    () => scaffoldPack(at('b'), { kind: 'derived', from: '@nowhere/pack', cwd: work }),
    /--from @nowhere\/pack: not installed here; install it first/
  );
  const plain = path.join(work, 'node_modules', 'plain-pack');
  fs.mkdirSync(plain);
  fs.writeFileSync(path.join(plain, 'package.json'), '{"name":"plain-pack","version":"1.0.0"}');
  fs.writeFileSync(path.join(plain, 'index.js'), "module.exports = { name: 'plain-pack' };");
  assert.throws(
    () => scaffoldPack(at('c'), { kind: 'derived', from: 'plain-pack', cwd: work }),
    /--from plain-pack: its standard is not in core's data format/
  );
  assert.throws(
    () => scaffoldPack(at('d'), { kind: 'standard', from: '@base/std-pack', cwd: work }),
    /--from is for a derived pack/
  );
  for (const name of ['a', 'b', 'c', 'd']) assert.ok(!fs.existsSync(at(name)), name);
});
