'use strict';

/**
 * The exports map is a public contract: a consumer can only reach the paths it
 * names. The browser bundle and the locale side files are both reached by path
 * rather than by require()ing a module -- a binding reads them as text and
 * evaluates them inside the page -- so a missing entry does not fail loudly at
 * build time, it fails at scan time in someone else's project.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const ROOT_DIR = path.join(__dirname, '..', '..');
const pkg = require(path.join(ROOT_DIR, 'package.json'));

// Resolve the way a consumer does: by package name, through the exports map.
const CONSUMER_DIR = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'surea11y-exports-'));
const scopeDir = path.join(CONSUMER_DIR, 'node_modules', '@surea11y');
fs.mkdirSync(scopeDir, { recursive: true });
fs.symlinkSync(ROOT_DIR, path.join(scopeDir, 'core'), 'dir');
const consumerRequire = createRequire(path.join(CONSUMER_DIR, 'index.js'));

const SHIPPED_LOCALES = fs
  .readdirSync(ROOT_DIR)
  .filter((f) => /^surea11y\.i18n\..+\.js$/.test(f))
  .map((f) => f.replace(/^surea11y\.i18n\.|\.js$/g, ''));

test('the browser bundle is reachable by path', () => {
  const resolved = consumerRequire.resolve('@surea11y/core/browser');
  assert.equal(path.basename(resolved), 'surea11y.browser.js');
  assert.ok(fs.readFileSync(resolved, 'utf8').includes('a11ycore'));
});

test('every shipped locale side file is reachable by path', () => {
  assert.ok(SHIPPED_LOCALES.length > 0, 'expected at least one locale side file');

  for (const locale of SHIPPED_LOCALES) {
    const resolved = consumerRequire.resolve(`@surea11y/core/i18n/${locale}`);
    assert.equal(path.basename(resolved), `surea11y.i18n.${locale}.js`);
  }
});

// require()d in Node, where no bundle is loaded, a side file used to throw
// "load surea11y.browser.js first". It gives its dictionary instead, the
// same one the Node engine carries.
test('a locale side file can be required in Node', () => {
  const { loadAllTranslations } = require(path.join(ROOT_DIR, 'scripts', 'build-core.js'));
  for (const locale of SHIPPED_LOCALES) {
    const side = consumerRequire(`@surea11y/core/i18n/${locale}`);
    assert.equal(side.locale, locale);
    assert.deepEqual(side.messages, loadAllTranslations()[locale]);
  }
});

test('a locale this build does not ship fails to resolve rather than resolving to nothing', () => {
  // Bindings branch on this: an unresolvable locale means fall back to English,
  // not carry on with an empty dictionary.
  assert.throws(() => consumerRequire.resolve('@surea11y/core/i18n/qqq'), {
    code: 'MODULE_NOT_FOUND'
  });
});

// A binding whose code runs in a browser reads the steps with the
// how-to-check entry and the review dictionary of each locale it shows.
test('the how-to-check entry and every review dictionary are reachable by name', () => {
  const entry = consumerRequire('@surea11y/core/how-to-check');
  assert.equal(typeof entry.applyHowToCheck, 'function');
  // With the steps, the readings a browser-run tool sorts them by: the same
  // functions as the main entry's.
  const main = consumerRequire('@surea11y/core');
  assert.equal(entry.occurrenceOutcome, main.occurrenceOutcome);
  assert.equal(entry.reviewGroupOf, main.reviewGroupOf);
  assert.equal(entry.HOOK_REASON_CODES, main.HOOK_REASON_CODES);
  const locales = fs
    .readdirSync(path.join(ROOT_DIR, 'src', 'i18n', 'review'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length));
  assert.ok(locales.includes('en') && locales.length > 1);
  for (const locale of locales) {
    assert.deepEqual(
      consumerRequire(`@surea11y/core/review/${locale}`),
      require(path.join(ROOT_DIR, 'src', 'i18n', 'review', `${locale}.json`))
    );
  }
  assert.ok(pkg.files.includes('src/i18n/review/*.json'));
});

// An app whose code runs in a browser reads how to assess each criterion
// with the procedures entry and the procedures dictionary of each locale.
test('the procedures entry and every procedures dictionary are reachable by name', () => {
  const entry = consumerRequire('@surea11y/core/procedures');
  assert.equal(typeof entry.proceduresFrom, 'function');
  const en = consumerRequire('@surea11y/core/procedures/en');
  assert.deepEqual(
    entry.proceduresFrom({ en }, '1.4.13'),
    consumerRequire('@surea11y/core').proceduresFor('1.4.13')
  );
  const core = consumerRequire('@surea11y/core');
  assert.deepEqual(
    entry.listProceduresFrom({ en }, { levels: 'A' }),
    core.listProcedures({ levels: 'A' })
  );
  assert.deepEqual(entry.procedureChecklistFrom({ en }), core.procedureChecklist());
  assert.equal(typeof entry.relatedRequirements, 'function');
  assert.equal(
    entry.renderProceduresFrom({ en }, core.procedureChecklist({ levels: 'A' })),
    core.renderProcedures(core.procedureChecklist({ levels: 'A' }))
  );
  assert.deepEqual(entry.relatedRequirements('1.4.3'), core.relatedRequirements('1.4.3'));
  const locales = fs
    .readdirSync(path.join(ROOT_DIR, 'src', 'i18n', 'procedures'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length));
  assert.ok(locales.includes('en') && locales.length > 1);
  // Its languages, from every dictionary core ships, as in Node.
  const dictionaries = Object.fromEntries(
    locales.map((l) => [l, consumerRequire(`@surea11y/core/procedures/${l}`)])
  );
  assert.deepEqual(entry.procedureLanguagesFrom(dictionaries), core.procedureLanguages());
  for (const locale of locales) {
    assert.deepEqual(
      consumerRequire(`@surea11y/core/procedures/${locale}`),
      require(path.join(ROOT_DIR, 'src', 'i18n', 'procedures', `${locale}.json`))
    );
  }
  for (const file of [
    'src/procedures.js',
    'src/procedures-core.js',
    'src/procedures/registry.js',
    'src/procedures/rules.json',
    'src/i18n/procedures/*.json'
  ]) {
    assert.ok(pkg.files.includes(file), file);
  }
});

test('every locale side file the exports map can reach is also published', () => {
  const patterns = Object.keys(pkg.exports);
  assert.ok(patterns.includes('./i18n/*'), 'exports map should expose the locale side files');
  assert.ok(
    pkg.files.some((f) => f.startsWith('surea11y.i18n.')),
    'files should publish the locale side files the exports map points at'
  );
});

// A module entry point loads only files the package publishes: one requiring
// a file `files` leaves out works here and throws in a consumer's project.
test('every module entry point loads only published files', () => {
  const { execFileSync } = require('node:child_process');
  // npm 10 and 11 print a list with one entry per package; npm 12 prints an
  // object keyed by package name.
  const report = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--silent'], {
      cwd: ROOT_DIR,
      encoding: 'utf8'
    })
  );
  const [entry] = Array.isArray(report) ? report : Object.values(report);
  const packed = entry.files.map((f) => f.path);
  const published = new Set(packed);

  const missing = [];
  for (const [subpath, entry] of Object.entries(pkg.exports)) {
    // A target is a path, or conditions such as { types, default }.
    const target = typeof entry === 'string' ? entry : entry.default;
    if (entry && entry.types && !published.has(entry.types.replace(/^\.\//, ''))) {
      missing.push(`${subpath}: ${entry.types} (types)`);
    }
    if (subpath.includes('*') || !target.endsWith('.js') || target.includes('browser')) continue;
    // A fresh process, so each entry point's own requires are what is loaded.
    const loaded = JSON.parse(
      execFileSync(
        process.execPath,
        [
          '-e',
          `require(${JSON.stringify(path.join(ROOT_DIR, target))});` +
            'console.log(JSON.stringify(Object.keys(require.cache)))'
        ],
        { encoding: 'utf8' }
      )
    );
    for (const file of loaded) {
      const rel = path.relative(ROOT_DIR, file).split(path.sep).join('/');
      if (rel.startsWith('..') || rel.startsWith('node_modules/')) continue;
      if (!published.has(rel)) missing.push(`${subpath}: ${rel}`);
    }
  }
  // A require inside a function runs only on the path that calls it, so
  // every relative require in a published file must resolve to one too.
  // The pack templates' requires resolve once a pack is written from them.
  const fs = require('node:fs');
  for (const rel of packed) {
    if (!/\.(c|m)?js$/.test(rel) || rel.startsWith('templates/')) continue;
    const source = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
    for (const m of source.matchAll(
      /\b(?:require|nodeRequire)\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g
    )) {
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      const found = [base, base + '.js', base + '.json', base + '/index.js'].some((c) =>
        published.has(c)
      );
      if (!found) missing.push(`${rel}: requires ${m[1]}`);
    }
  }
  assert.deepEqual(missing, [], 'add these to package.json "files"');
});
