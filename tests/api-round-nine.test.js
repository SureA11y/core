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

test("the HTML report's Understanding link names the criterion in the report's language (A9-6)", () => {
  const { renderHtmlReport } = require('../src/report.js');
  const links = (locale, engineOptions = {}) =>
    renderHtmlReport(
      runa11yCoreOnHtml(PAGE, {
        engineOptions: { locale, ...engineOptions },
        entryPointParity: false
      })
    ).match(/<p class="card-help">.*?<\/p>/g) || [];
  const of = (list, sc) => list.find((l) => l.includes(`>${sc} `) || l.includes(` ${sc} `));
  assert.match(of(links('de'), '1.1.1'), />1\.1\.1 Nicht-Text-Inhalt verstehen</);
  assert.match(of(links('fr'), '1.1.1'), />Comprendre 1\.1\.1 Contenu non textuel</);
  assert.match(of(links('en'), '1.1.1'), />Understanding 1\.1\.1 Non-text Content</);
  // A title the dictionaries don't translate (WCAG 2.1's "Parsing") stays
  // English, marked as such.
  const parsing = links('de', {
    wcagVersion: '2.1',
    customRules: [
      {
        id: 'acme-parse',
        meta: { title: 't', wcagSc: ['4.1.1'] },
        runInPage: "() => ({ outcome: 'fail', occurrences: [{ selector: 'img' }] })"
      }
    ]
  });
  assert.match(of(parsing, '4.1.1'), />4\.1\.1 <span lang="en">Parsing<\/span> verstehen</);
});

test('a rollup catalog entry has its title and description in the locale, as a rule entry has (A9-7)', () => {
  const core = require('../src/index.js');
  const id = 'wcag-1.1.1-non-text-content';
  const german = runa11yCoreOnHtml(PAGE, {
    engineOptions: { locale: 'de' },
    entryPointParity: false
  }).rulesResults.find((r) => r.ruleId === id);
  const entries = [
    core.getRulesCatalog({ locale: 'de' }).find((e) => e.id === id),
    core.getCompositeRuleById(id, { locale: 'de' }),
    core.getRulesForRunOnly(['img-alt-present'], { locale: 'de' }).find((e) => e.id === id)
  ];
  for (const entry of entries) {
    assert.equal(entry.title, german.title);
    assert.equal(entry.description, german.description);
    assert.equal(entry.meta.title, german.title);
    assert.deepEqual(entry.i18n, german.i18n);
  }
  assert.notEqual(german.title, core.getCompositeRuleById(id).title);
  assert.equal(core.getCompositeRuleById(id).title, core.getCompositeRuleById(id).meta.title);
  for (const entry of core.getRulesCatalog({ optInRules: 'all' })) {
    assert.equal(typeof entry.title, 'string', entry.id);
    assert.ok(entry.title, entry.id);
  }
});
