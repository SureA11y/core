'use strict';

/**
 * The integrator's API: what the ninth stress test found (round 9, A9-*).
 * Locale keys in the caller's messages, the HTML report's links, the
 * catalog's rollups, packs the scan can't prepare, reporter options, the
 * procedures' filters, standard data and baseline keys.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>';

const titleOf = (result, ruleId) => result.checksResults.find((c) => c.ruleId === ruleId).title;

test('a messages key differing in case from the locale is used, over the built-in dictionary (A9-3)', () => {
  const { getCheckDefById } = require('../src/index.js');
  const german = getCheckDefById('button-name-present', { locale: 'de' }).title;
  assert.notEqual(german, getCheckDefById('button-name-present').title);
  for (const [locale, key] of [
    ['de', 'DE'],
    ['DE', 'De'],
    ['De', 'de']
  ]) {
    const result = runa11yCoreOnHtml(PAGE, {
      engineOptions: { locale, messages: { [key]: { img_altPresent_title: 'Eigener Text' } } }
    });
    assert.equal(titleOf(result, 'img-alt-present'), 'Eigener Text', `${locale} / ${key}`);
    assert.equal(titleOf(result, 'button-name-present'), german, `${locale} / ${key}`);
    assert.equal(result.engine.locale.reason, 'ok', `${locale} / ${key}`);
  }
  // The English fallback reads the caller's English in any case too.
  const result = runa11yCoreOnHtml(PAGE, {
    engineOptions: {
      locale: 'fr',
      messages: { EN: { acme_title: 'Acme' } },
      customRules: [
        {
          id: 'acme-x',
          meta: { title: 't', i18n: { titleKey: 'acme_title' } },
          runInPage: "() => ({ outcome: 'pass', occurrences: [] })"
        }
      ]
    }
  });
  assert.equal(titleOf(result, 'acme-x'), 'Acme');
});
