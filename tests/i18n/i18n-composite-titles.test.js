'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const composites = require('../../src/catalogs/composites.wcag.js');
const enDict = require('../../src/i18n/en.json');
const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

// The catalog keeps English text as the fallback for a missing key, and
// en.json is what a scan actually shows. If the two drift, English reports
// change without anyone editing the catalog.
test('every composite names dictionary keys whose English matches the catalog', () => {
  const problems = [];
  for (const c of composites) {
    for (const field of ['title', 'description']) {
      const key = c.meta[`${field}Key`];
      if (!key) problems.push(`${c.id}: no ${field}Key`);
      else if (enDict[key] !== c.meta[field])
        problems.push(`${c.id}: ${key} differs from meta.${field}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('rollup titles and descriptions follow the scan locale', () => {
  const html =
    '<!doctype html><html><head><title>t</title></head><body><img src="x.png"></body></html>';
  const byId = (locale) =>
    new Map(
      runa11yCoreOnHtml(html, { engineOptions: { locale } }).rulesResults.map((r) => [r.ruleId, r])
    );

  const en = byId('en');
  const ja = byId('ja');
  const nonText = ja.get('wcag-1.1.1-non-text-content');

  assert.equal(nonText.title, '非テキストコンテンツ: テキストによる代替');
  for (const [id, r] of ja) {
    assert.notEqual(r.title, en.get(id).title, `${id} title is still English`);
    assert.notEqual(r.description, en.get(id).description, `${id} description is still English`);
  }
});
