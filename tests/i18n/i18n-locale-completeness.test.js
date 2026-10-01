'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { i18nSources, localesOf, loadDictionaries } = require('../../scripts/lib/dictionaries');

const ROOT = path.join(__dirname, '..', '..');

// Every translation, folder by folder: core's locales against core's en.json,
// and each profile's against its own. A profile has the languages it chooses
// (scripts/lib/dictionaries.js), so a locale it has no file for is not here:
// its messages show in English there.
const FILES = i18nSources().flatMap(({ dir }) => {
  const dicts = loadDictionaries([dir]);
  return localesOf(dir)
    .filter((locale) => locale !== 'en')
    .map((locale) => ({
      name: path.relative(ROOT, path.join(dir, `${locale}.json`)),
      enDict: dicts.en,
      dict: dicts[locale] || {}
    }));
});

// npm run i18n:sync keeps every locale at full key parity with its en.json, so
// any drift here means it was not run.
for (const { name, enDict, dict } of FILES) {
  const enKeys = new Set(Object.keys(enDict));

  test(`i18n locale completeness: ${name} has no orphaned keys`, () => {
    const orphaned = Object.keys(dict).filter((k) => !enKeys.has(k));
    assert.deepStrictEqual(
      orphaned,
      [],
      `${name} has keys not present in its en.json (renamed/removed key?): ${orphaned.join(', ')}`
    );
  });

  test(`i18n locale completeness: ${name} carries every en.json key`, () => {
    const keys = new Set(Object.keys(dict));
    const missing = [...enKeys].filter((k) => !keys.has(k));
    assert.deepStrictEqual(
      missing,
      [],
      `${name} is missing ${missing.length} key(s), run \`npm run i18n:sync\`: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`
    );
  });
}

// A translation may move a {{placeholder}} or a {{#section}} marker within the
// sentence, but dropping or misspelling one silently loses the value it
// carries, so every locale has to carry the same set as English.
const PLACEHOLDER = /\{\{[#^/]?\s*[\w.]+\s*\}\}/g;
const placeholdersOf = (value) =>
  (String(value).match(PLACEHOLDER) || []).map((p) => p.replace(/\s+/g, '')).sort();

for (const { name, enDict, dict } of FILES) {
  test(`i18n locale completeness: ${name} keeps every placeholder`, () => {
    const drifted = Object.keys(enDict).filter(
      (key) =>
        key in dict && placeholdersOf(dict[key]).join('|') !== placeholdersOf(enDict[key]).join('|')
    );
    assert.deepStrictEqual(
      drifted,
      [],
      `${name} has values whose placeholders differ from en.json: ${drifted.join(', ')}`
    );
  });

  // A single-brace {name} is never interpolated and shows up literally.
  test(`i18n locale completeness: ${name} has no single-brace placeholder`, () => {
    const broken = Object.keys(dict).filter(
      (key) =>
        typeof dict[key] === 'string' && /(?<!\{)\{[#^/]?\s*[\w.]+\s*\}(?!\})/.test(dict[key])
    );
    assert.deepStrictEqual(
      broken,
      [],
      `${name} has single-brace placeholders: ${broken.join(', ')}`
    );
  });
}
