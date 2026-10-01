'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { syncDict, syncLocale, syncAll } = require('../scripts/i18n-sync.js');
const { i18nDirs } = require('../scripts/lib/dictionaries');
const {
  I18N_DIR,
  listLocales,
  loadDict,
  localePath,
  serializeLocale
} = require('../scripts/i18n-scaffold.js');

function writeDict(dir, locale, dict) {
  fs.writeFileSync(path.join(dir, `${locale}.json`), JSON.stringify(dict, null, 2));
}

function makeTmpI18nDir(locales = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-sync-test-'));
  writeDict(dir, 'en', { a: 'A', b: 'B' });
  for (const [locale, dict] of Object.entries(locales)) writeDict(dir, locale, dict);
  return dir;
}

test('syncDict seeds keys new to English with the English text and reports them', () => {
  const result = syncDict({ a: 'A', b: 'B' }, { a: 'Ä' });

  assert.deepEqual(result.dict, { a: 'Ä', b: 'B' });
  assert.deepEqual(result.added, ['b']);
  assert.deepEqual(result.removed, []);
});

test('syncDict drops keys no longer in English and reports them', () => {
  const result = syncDict({ a: 'A' }, { a: 'Ä', stale: 'Alt' });

  assert.deepEqual(result.dict, { a: 'Ä' });
  assert.deepEqual(result.removed, ['stale']);
});

test('syncDict never overwrites an existing translated value', () => {
  const result = syncDict({ a: 'A', b: 'B' }, { a: 'Ä', b: 'Bö' });

  assert.deepEqual(result.dict, { a: 'Ä', b: 'Bö' });
  assert.deepEqual(result.added, []);
});

test('syncDict counts a value identical to English as untranslated', () => {
  const result = syncDict({ a: 'A', b: 'B', c: 'C' }, { a: 'Ä', b: 'B' });

  assert.deepEqual(result.untranslated, ['b', 'c']);
});

test('syncDict emits keys in English order regardless of the locale order', () => {
  const result = syncDict({ a: 'A', b: 'B', c: 'C' }, { c: 'Ç', a: 'Ä' });

  assert.deepEqual(Object.keys(result.dict), ['a', 'b', 'c']);
});

test('syncLocale writes the merged dictionary to disk', () => {
  const dir = makeTmpI18nDir({ de: { a: 'Ä', stale: 'Alt' } });

  const result = syncLocale('de', { i18nDir: dir });

  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ['b']);
  assert.deepEqual(result.removed, ['stale']);
  assert.deepEqual(loadDict(result.filePath), { a: 'Ä', b: 'B' });
});

test('syncLocale in check mode reports the drift without writing', () => {
  const dir = makeTmpI18nDir({ de: { a: 'Ä' } });
  const before = fs.readFileSync(path.join(dir, 'de.json'), 'utf8');

  const result = syncLocale('de', { i18nDir: dir, check: true });

  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ['b']);
  assert.equal(fs.readFileSync(path.join(dir, 'de.json'), 'utf8'), before);
});

test('syncLocale is idempotent', () => {
  const dir = makeTmpI18nDir({ de: { a: 'Ä' } });

  syncLocale('de', { i18nDir: dir });

  assert.equal(syncLocale('de', { i18nDir: dir }).changed, false);
});

test('syncLocale rejects a locale that has no file yet', () => {
  const dir = makeTmpI18nDir();

  assert.throws(() => syncLocale('pt-BR', { i18nDir: dir }), /does not exist/);
});

test('syncAll covers every non-English locale when none is named', () => {
  const dir = makeTmpI18nDir({ de: { a: 'Ä' }, fr: { a: 'À' } });

  const results = syncAll({ i18nDir: dir });

  assert.deepEqual(
    results.map((r) => r.locale),
    ['de', 'fr']
  );
  assert.ok(results.every((r) => r.added.length === 1));
});

test('syncAll restricts itself to the named locales', () => {
  const dir = makeTmpI18nDir({ de: { a: 'Ä' }, fr: { a: 'À' } });

  const results = syncAll({ i18nDir: dir, locales: ['fr'] });

  assert.deepEqual(
    results.map((r) => r.locale),
    ['fr']
  );
  assert.deepEqual(loadDict(path.join(dir, 'de.json')), { a: 'Ä' });
});

test('listLocales excludes en', () => {
  const dir = makeTmpI18nDir({ de: {}, fr: {} });

  assert.deepEqual(listLocales(dir), ['de', 'fr']);
});

// Every dictionary folder, core's and each profile's, for core's locales.
const DICTIONARY_FILES = i18nDirs().flatMap((i18nDir) =>
  listLocales(I18N_DIR).map((locale) => ({
    i18nDir,
    locale,
    name: path.relative(path.join(__dirname, '..'), path.join(i18nDir, `${locale}.json`))
  }))
);

for (const { i18nDir, locale, name } of DICTIONARY_FILES) {
  test(`${name} is in sync with its en.json`, () => {
    const result = syncLocale(locale, { i18nDir, check: true, create: true });

    assert.deepEqual(
      result.added,
      [],
      `keys missing from ${locale}.json: ${result.added.join(', ')}`
    );
    assert.deepEqual(
      result.removed,
      [],
      `keys in ${locale}.json that en.json no longer has: ${result.removed.join(', ')}`
    );
    assert.equal(result.changed, false, `run \`npm run i18n:sync\` to update ${name}`);
  });
}

for (const i18nDir of i18nDirs()) {
  for (const locale of ['en', ...listLocales(I18N_DIR)]) {
    const filePath = localePath(locale, i18nDir);
    test(`${path.relative(path.join(__dirname, '..'), filePath)} is formatted as i18n:sync would write it`, () => {
      assert.equal(serializeLocale(loadDict(filePath)), fs.readFileSync(filePath, 'utf8'));
    });
  }
}
