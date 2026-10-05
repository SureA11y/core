'use strict';

/**
 * src/i18n-same-as-english.json lists strings that are rightly the same in a
 * language as in English ("Element" in German), so coverage counts them as
 * translated. Each entry names the English it was checked against. This keeps
 * the list honest: every entry must still match both the English and the
 * locale, so a change to either sends the string back to being counted as
 * untranslated until someone checks it again, and a stale entry fails here.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const LIST = require('../../src/i18n-same-as-english.json');
const { computeLocaleReport, sameAsEnglishFor } = require('../../src/i18n-coverage.js');
const { loadDictionaries } = require('../../scripts/lib/dictionaries');

const dicts = loadDictionaries();

test('every listed string still matches the English and the locale', () => {
  for (const [locale, entries] of Object.entries(LIST)) {
    if (locale === '$comment') continue;
    assert.ok(dicts[locale], `${locale} is a shipped locale`);
    for (const [key, text] of Object.entries(entries)) {
      assert.equal(dicts.en[key], text, `${locale} ${key}: the English is still "${text}"`);
      assert.equal(dicts[locale][key], text, `${locale} ${key}: the locale still says "${text}"`);
    }
  }
});

test('a listed string counts as translated, and stops counting once the English changes', () => {
  const en = { a: 'Element', b: 'Hello' };
  const de = { a: 'Element', b: 'Hello' };
  assert.equal(computeLocaleReport(en, de).translated, 0);
  assert.equal(computeLocaleReport(en, de, null, { a: 'Element' }).translated, 1);
  assert.equal(
    computeLocaleReport({ ...en, a: 'Item' }, { ...de, a: 'Item' }, null, { a: 'Element' })
      .translated,
    0,
    'checked against other English: untranslated again'
  );
});

test('sameAsEnglishFor gives a locale its entries, and nothing for others', () => {
  assert.deepEqual(sameAsEnglishFor('de'), { report_margins_col_element: 'Element' });
  assert.deepEqual(sameAsEnglishFor('ja'), {});
  assert.deepEqual(sameAsEnglishFor('$comment'), {});
});
