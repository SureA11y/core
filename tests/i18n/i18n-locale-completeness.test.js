'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const I18N_DIR = path.join(__dirname, '..', '..', 'src', 'i18n');

function loadLocale(name) {
  return JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${name}.json`), 'utf8'));
}

const enKeys = new Set(Object.keys(loadLocale('en')));

const localeFiles = fs
  .readdirSync(I18N_DIR)
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
      `${locale}.json is missing ${missing.length} key(s) — run \`npm run i18n:sync\`: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`
    );
  });
}
