'use strict';

/**
 * scripts/lib/dictionaries.js: core's dictionaries and each profile's make one
 * dictionary per locale, and no profile may define a key core (or another
 * profile) already has.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { CORE_I18N_DIR, i18nDirs, loadDictionaries } = require('../../scripts/lib/dictionaries');
const PROFILES = require('../../profiles');

function makeDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'surea11y-dict-'));
  for (const [locale, dict] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(dict));
  }
  return dir;
}

test('core first, then each profile with a dictionary, in registry order', () => {
  const expected = [CORE_I18N_DIR].concat(PROFILES.map((p) => p.i18nDir).filter(Boolean));
  assert.deepEqual(i18nDirs(), expected);
});

test('folders merge per locale, in the order given', () => {
  const core = makeDir({ en: { a: 'A' }, fr: { a: 'A fr' } });
  const profile = makeDir({ en: { b: 'B' }, fr: { b: 'B fr' } });
  const dicts = loadDictionaries([core, profile]);
  assert.deepEqual(dicts.en, { a: 'A', b: 'B' });
  assert.deepEqual(dicts.fr, { a: 'A fr', b: 'B fr' });
  assert.deepEqual(Object.keys(dicts.en), ['a', 'b']);
});

test('a key two folders define is refused, naming both files', () => {
  const core = makeDir({ en: { a: 'A' } });
  const profile = makeDir({ en: { a: 'Overridden' } });
  assert.throws(
    () => loadDictionaries([core, profile]),
    (e) => /i18n key "a" is defined in both/.test(e.message) && e.message.includes('en.json')
  );
});

test('a file that is not a JSON object is refused', () => {
  const dir = makeDir({ en: ['not', 'an', 'object'] });
  assert.throws(() => loadDictionaries([dir]), /must hold a JSON object/);
});

test('the real dictionaries load without a clash, every locale with the same keys', () => {
  const dicts = loadDictionaries();
  const enKeys = Object.keys(dicts.en).sort();
  for (const [locale, dict] of Object.entries(dicts)) {
    assert.deepEqual(Object.keys(dict).sort(), enKeys, `${locale} differs from en`);
  }
});
