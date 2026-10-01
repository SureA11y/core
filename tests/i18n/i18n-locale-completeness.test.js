'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const { CORE_I18N_DIR, loadDictionaries } = require('../../scripts/lib/dictionaries');

// Each locale as the engine sees it: core's dictionary and each profile's.
const DICTIONARIES = loadDictionaries();

function loadLocale(name) {
  return DICTIONARIES[name] || {};
}

const enKeys = new Set(Object.keys(loadLocale('en')));

const localeFiles = fs
  .readdirSync(CORE_I18N_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

// npm run i18n:sync keeps every locale at full key parity with en.json, so any
// drift here means it was not run.
for (const locale of localeFiles) {
  test(`i18n locale completeness: ${locale}.json has no orphaned keys`, () => {
    const keys = Object.keys(loadLocale(locale));
    const orphaned = keys.filter((k) => !enKeys.has(k));
    assert.deepStrictEqual(
      orphaned,
      [],
      `${locale}.json has keys not present in en.json (renamed/removed key?): ${orphaned.join(', ')}`
    );
  });

  test(`i18n locale completeness: ${locale}.json carries every en.json key`, () => {
    const keys = new Set(Object.keys(loadLocale(locale)));
    const missing = [...enKeys].filter((k) => !keys.has(k));
    assert.deepStrictEqual(
      missing,
      [],
      `${locale}.json is missing ${missing.length} key(s), run \`npm run i18n:sync\`: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`
    );
  });
}

// A translation may move a {{placeholder}} or a {{#section}} marker within the
// sentence, but dropping or misspelling one silently loses the value it
// carries, so every locale has to carry the same set as English.
const enDict = loadLocale('en');
const PLACEHOLDER = /\{\{[#^/]?\s*[\w.]+\s*\}\}/g;
const placeholdersOf = (value) =>
  (String(value).match(PLACEHOLDER) || []).map((p) => p.replace(/\s+/g, '')).sort();

for (const locale of localeFiles) {
  test(`i18n locale completeness: ${locale}.json keeps every placeholder`, () => {
    const dict = loadLocale(locale);
    const drifted = Object.keys(enDict).filter(
      (key) =>
        key in dict && placeholdersOf(dict[key]).join('|') !== placeholdersOf(enDict[key]).join('|')
    );
    assert.deepStrictEqual(
      drifted,
      [],
      `${locale}.json has values whose placeholders differ from en.json: ${drifted.join(', ')}`
    );
  });

  // A single-brace {name} is never interpolated and shows up literally.
  test(`i18n locale completeness: ${locale}.json has no single-brace placeholder`, () => {
    const dict = loadLocale(locale);
    const broken = Object.keys(dict).filter(
      (key) =>
        typeof dict[key] === 'string' && /(?<!\{)\{[#^/]?\s*[\w.]+\s*\}(?!\})/.test(dict[key])
    );
    assert.deepStrictEqual(
      broken,
      [],
      `${locale}.json has single-brace placeholders: ${broken.join(', ')}`
    );
  });
}
