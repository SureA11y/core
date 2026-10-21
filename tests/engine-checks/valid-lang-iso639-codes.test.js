'use strict';

// valid-lang checks a lang value's primary subtag against the IANA registry,
// as BCP 47 and ACT de46e4 do. A standard that accepts any ISO 639 code (RGAA's
// "Code de langue") runs it as a variant with codes: 'iso639', which also
// takes the three-letter codes the registry leaves out and the local-use range.

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { definePack } = require('../../src/pack.js');
const { createDomHelpers } = require('../../src/core/dom-helpers.js');

const page = (lang) =>
  `<!doctype html><html lang="en"><head><title>t</title></head><body><p id="p" lang="${lang}">Texte</p></body></html>`;

const variant = (config) =>
  definePack({
    name: 'codes',
    version: '1.0.0',
    namespace: 'iso',
    core: '*',
    rules: [
      {
        id: 'iso-valid-lang',
        from: 'valid-lang',
        config,
        meta: {
          title: 'Language code',
          tags: ['iso'],
          i18n: { titleKey: 'isoValidLang_title', descriptionKey: 'isoValidLang_description' }
        }
      }
    ]
  });

const outcome = (lang, config) => {
  const result = config
    ? runa11yCoreOnHtml(page(lang), {
        runOnly: ['iso-valid-lang'],
        engineOptions: { packs: [variant(config)] }
      })
    : runa11yCoreOnHtml(page(lang), { runOnly: ['valid-lang'] });
  return result.checksResults.find((r) => r.ruleId === (config ? 'iso-valid-lang' : 'valid-lang'))
    .outcome;
};

// Three-letter ISO 639-2 terminology and bibliographic codes, an ISO 639-3
// code, and the local-use range, none of which the registry lists.
const ISO_ONLY = ['fra', 'fre', 'eng', 'deu', 'ger', 'zho', 'chi', 'hbs', 'qaa', 'qtz', 'FRA-fr'];

test('valid-lang fails codes the registry leaves out, by default and with codes: registry', () => {
  for (const lang of ISO_ONLY) {
    assert.equal(outcome(lang), 'fail', lang);
    assert.equal(outcome(lang, { codes: 'registry' }), 'fail', lang);
  }
});

test('a variant with codes: iso639 passes any ISO 639 code', () => {
  for (const lang of [...ISO_ONLY, 'fr', 'fr-FR', 'ast', 'yue-Hant']) {
    assert.equal(outcome(lang, { codes: 'iso639' }), 'pass', lang);
  }
});

test('a variant with codes: iso639 still fails what is no ISO 639 code', () => {
  for (const lang of ['xx', 'qza', 'fran', 'xyz123!!', 'en_US', ' ']) {
    assert.equal(outcome(lang, { codes: 'iso639' }), 'fail', JSON.stringify(lang));
  }
});

test('a variant given a value codes does not take is refused', () => {
  assert.throws(() => variant({ codes: 'iso639-1' }), /codes must be one of "registry", "iso639"/);
});

test('isIso639LanguageCode and isValidLanguageTag with codes: iso639', () => {
  const dom = new JSDOM('<p>x</p>');
  const helpers = createDomHelpers({ document: dom.window.document, window: dom.window });
  for (const code of ['fr', 'fra', 'FRE', 'hbs', 'qaa', 'qtz', 'ast']) {
    assert.equal(helpers.isIso639LanguageCode(code), true, code);
  }
  for (const code of ['', 'x', 'xx', 'qza', 'fran', 'fr-FR', null]) {
    assert.equal(helpers.isIso639LanguageCode(code), false, String(code));
  }
  assert.equal(helpers.isValidLanguageTag('ger-DE', { codes: 'iso639' }), true);
  assert.equal(helpers.isValidLanguageTag('ger-DE'), false);
  assert.equal(helpers.isValidLanguageTag('ger-DE', { codes: 'registry' }), false);
});
