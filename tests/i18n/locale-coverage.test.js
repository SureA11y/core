'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { getLocaleCoverage } = require('../../src/index.js');
const { computeLocaleReport } = require('../../src/i18n-coverage.js');
const { i18nSources, loadDictionaries } = require('../../scripts/lib/dictionaries.js');

// What the package ships: core's dictionaries with every built-in profile's
// merged in, as the build does.
const shipped = loadDictionaries(i18nSources().map((s) => s.dir));

test('getLocaleCoverage reports every shipped locale but English, in order', () => {
  const coverage = getLocaleCoverage();
  assert.equal(coverage.sourceLocale, 'en');
  assert.equal(coverage.totalKeys, Object.keys(shipped.en).length);
  assert.ok(
    coverage.totalKeys > Object.keys(require('../../src/i18n/en.json')).length,
    "the profiles' messages count too"
  );
  const locales = coverage.locales.map((l) => l.locale);
  assert.deepEqual(locales, [...locales].sort());
  assert.ok(!locales.includes('en'));
  for (const name of ['de', 'es', 'fr', 'ja']) assert.ok(locales.includes(name), name);
});

test('getLocaleCoverage counts the dictionaries the package ships, core and profiles alike', () => {
  const fromPackage = getLocaleCoverage().locales;
  const expected = Object.keys(shipped)
    .filter((locale) => locale !== 'en')
    .sort()
    .map((locale) => ({ locale, ...computeLocaleReport(shipped.en, shipped[locale]) }));
  assert.deepEqual(fromPackage, expected);
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
