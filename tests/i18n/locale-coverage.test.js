'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { getLocaleCoverage } = require('../../src/index.js');
const { computeLocaleReport } = require('../../src/i18n-coverage.js');
const { generateReport } = require('../../scripts/i18n-report.js');

test('getLocaleCoverage reports every shipped locale but English, in order', () => {
  const coverage = getLocaleCoverage();
  assert.equal(coverage.sourceLocale, 'en');
  const en = require('../../src/i18n/en.json');
  assert.equal(coverage.totalKeys, Object.keys(en).length);
  const locales = coverage.locales.map((l) => l.locale);
  assert.deepEqual(locales, [...locales].sort());
  assert.ok(!locales.includes('en'));
  for (const name of ['de', 'es', 'fr', 'ja']) assert.ok(locales.includes(name), name);
});

test("getLocaleCoverage agrees with npm run i18n:report on core's dictionaries", () => {
  const fromPackage = getLocaleCoverage().locales;
  const fromScript = generateReport(path.join(__dirname, '../../src/i18n'));
  assert.deepEqual(
    fromPackage,
    [...fromScript].sort((a, b) => a.locale.localeCompare(b.locale))
  );
});

test('computeLocaleReport counts translated, missing and orphaned keys', () => {
  const en = { a: 'One', b: 'Two', c: 'Three', d: 'ARIA' };
  const xx = { a: 'Uno', b: 'Two', d: 'ARIA', z: 'stale' };
  assert.deepEqual(computeLocaleReport(en, xx), {
    total: 4,
    translated: 1,
    missing: 1,
    orphaned: ['z'],
    percent: 25
  });
});

test('computeLocaleReport leaves out keys a locale omits by choice', () => {
  const en = { a: 'One', b: 'Two', p: 'Profile text' };
  const xx = { a: 'Uno', b: 'Dos' };
  assert.deepEqual(computeLocaleReport(en, xx, { p: true }), {
    total: 2,
    translated: 2,
    missing: 0,
    orphaned: [],
    percent: 100
  });
});

// docs/I18N.md's coverage table gives figures nothing used to check, so it
// went stale with each new key. Its Keys, Untranslated and Same as English
// columns must match the dictionaries, as must the example's totalKeys.
test('the coverage table in docs/I18N.md matches the dictionaries', () => {
  const fs = require('node:fs');
  const doc = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'I18N.md'), 'utf8');
  const coverage = getLocaleCoverage();
  const same = require('../../src/i18n-same-as-english.json');
  const rows = new Map();
  for (const line of doc.split('\n')) {
    const m = /^\| `([a-z-]+)` \([^)]*\) \| [^|]+ \| (\d+) \| ([^|]+) \| ([^|]+) \|$/.exec(line);
    if (m) rows.set(m[1], { keys: Number(m[2]), untranslated: m[3].trim(), same: m[4].trim() });
  }
  assert.equal(rows.get('en').keys, coverage.totalKeys, 'en');
  for (const l of coverage.locales) {
    const row = rows.get(l.locale);
    assert.ok(row, `docs/I18N.md has a row for ${l.locale}`);
    assert.equal(row.keys, l.total, l.locale);
    assert.equal(row.untranslated, String(l.total - l.translated), l.locale);
    assert.equal(
      Number(row.same.split(':')[0]),
      Object.keys(same[l.locale] || {}).length,
      l.locale
    );
  }
  assert.ok(doc.includes(`totalKeys: ${coverage.totalKeys},`), 'the example’s totalKeys');
});
