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
