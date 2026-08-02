'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { computeLocaleReport, generateReport } = require('../scripts/i18n-report.js');

test('computeLocaleReport counts translated/missing/orphaned keys', () => {
  const en = { a: 'Hello', b: 'World', c: 'Foo' };
  const locale = { a: 'Bonjour', b: 'World', d: 'Extra' };

  const report = computeLocaleReport(en, locale);

  assert.equal(report.total, 3);
  assert.equal(report.translated, 1); // only "a" differs from English
  assert.equal(report.missing, 1); // "c" is absent from the locale
  assert.deepEqual(report.orphaned, ['d']); // "d" is not a real en.js key
  assert.equal(report.percent, Math.round((1 / 3) * 1000) / 10);
});

test('computeLocaleReport reports 0% for a freshly scaffolded locale (identical to English)', () => {
  const en = { a: 'Hello', b: 'World' };
  const report = computeLocaleReport(en, { ...en });

  assert.equal(report.translated, 0);
  assert.equal(report.missing, 0);
  assert.deepEqual(report.orphaned, []);
  assert.equal(report.percent, 0);
});

test('generateReport scans every non-English locale file in the i18n directory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-report-test-'));
  fs.writeFileSync(path.join(dir, 'en.js'), `module.exports = { a: 'Hello', b: 'World' };`);
  fs.writeFileSync(path.join(dir, 'fr.js'), `module.exports = { a: 'Bonjour', b: 'World' };`);
  fs.writeFileSync(path.join(dir, 'de.js'), `module.exports = { a: 'Hallo', b: 'Welt' };`);

  const rows = generateReport(dir);
  const byLocale = Object.fromEntries(rows.map((r) => [r.locale, r]));

  assert.equal(rows.length, 2);
  assert.equal(byLocale.fr.translated, 1);
  assert.equal(byLocale.de.translated, 2);
});
