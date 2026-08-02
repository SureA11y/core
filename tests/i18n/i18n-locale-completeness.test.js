'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const I18N_DIR = path.join(__dirname, '..', '..', 'src', 'i18n');

// Locales documented in docs/I18N.md as fully translated (100% coverage).
// Keep this list in sync with that table: a locale listed here is asserted
// to carry every key en.js has, so coverage drift fails the build instead
// of silently degrading to English per-string.
const FULLY_TRANSLATED_LOCALES = ['fr'];

function loadLocale(name) {
  return require(path.join(I18N_DIR, `${name}.js`));
}

const enKeys = new Set(Object.keys(loadLocale('en')));

const localeFiles = fs
  .readdirSync(I18N_DIR)
  .filter((f) => f.endsWith('.js') && f !== 'en.js')
  .map((f) => f.replace(/\.js$/, ''));

for (const locale of localeFiles) {
  test(`i18n locale completeness: ${locale}.js has no orphaned keys`, () => {
    const keys = Object.keys(loadLocale(locale));
    const orphaned = keys.filter((k) => !enKeys.has(k));
    assert.deepStrictEqual(
      orphaned,
      [],
      `${locale}.js has keys not present in en.js (renamed/removed key?): ${orphaned.join(', ')}`
    );
  });
}

for (const locale of FULLY_TRANSLATED_LOCALES) {
  test(`i18n locale completeness: ${locale}.js matches en.js coverage (documented as 100%)`, () => {
    assert.ok(
      localeFiles.includes(locale),
      `src/i18n/${locale}.js is missing but listed in FULLY_TRANSLATED_LOCALES`
    );
    const keys = new Set(Object.keys(loadLocale(locale)));
    const missing = [...enKeys].filter((k) => !keys.has(k));
    assert.deepStrictEqual(
      missing,
      [],
      `${locale}.js is documented in docs/I18N.md as 100% coverage but is missing ${missing.length} key(s): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`
    );
  });
}
