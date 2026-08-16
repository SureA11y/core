'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { syncDict, syncLocale, syncAll, listLocales } = require('../scripts/i18n-sync.js');
const {
  loadDict,
  parseLocaleFile,
  readLayout,
  mergeLayout,
  serializeLocaleSource,
  formatWithPrettier
} = require('../scripts/i18n-scaffold.js');

const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');

function writeDict(dir, locale, body) {
  fs.writeFileSync(path.join(dir, `${locale}.js`), `'use strict';\nmodule.exports = ${body};\n`);
}

function makeTmpI18nDir(locales = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-sync-test-'));
  writeDict(dir, 'en', `{ a: 'A', b: 'B' }`);
  for (const [locale, body] of Object.entries(locales)) writeDict(dir, locale, body);
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

test('syncLocale writes the merged dictionary to disk', async () => {
  const dir = makeTmpI18nDir({ de: `{ a: 'Ä', stale: 'Alt' }` });

  const result = await syncLocale('de', { i18nDir: dir });

  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ['b']);
  assert.deepEqual(result.removed, ['stale']);
  assert.deepEqual(loadDict(result.filePath), { a: 'Ä', b: 'B' });
});

test('syncLocale in check mode reports the drift without writing', async () => {
  const dir = makeTmpI18nDir({ de: `{ a: 'Ä' }` });
  const before = fs.readFileSync(path.join(dir, 'de.js'), 'utf8');

  const result = await syncLocale('de', { i18nDir: dir, check: true });

  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ['b']);
  assert.equal(fs.readFileSync(path.join(dir, 'de.js'), 'utf8'), before);
});

test('syncLocale is idempotent', async () => {
  const dir = makeTmpI18nDir({ de: `{ a: 'Ä' }` });

  await syncLocale('de', { i18nDir: dir });
  const second = await syncLocale('de', { i18nDir: dir });

  assert.equal(second.changed, false);
});

test('syncLocale rejects a locale that has no file yet', async () => {
  const dir = makeTmpI18nDir();

  await assert.rejects(() => syncLocale('pt-BR', { i18nDir: dir }), /does not exist/);
});

test('syncAll covers every non-English locale when none is named', async () => {
  const dir = makeTmpI18nDir({ de: `{ a: 'Ä' }`, fr: `{ a: 'À' }` });

  const results = await syncAll({ i18nDir: dir });

  assert.deepEqual(
    results.map((r) => r.locale),
    ['de', 'fr']
  );
  assert.ok(results.every((r) => r.added.length === 1));
});

test('syncAll restricts itself to the named locales', async () => {
  const dir = makeTmpI18nDir({ de: `{ a: 'Ä' }`, fr: `{ a: 'À' }` });

  const results = await syncAll({ i18nDir: dir, locales: ['fr'] });

  assert.deepEqual(
    results.map((r) => r.locale),
    ['fr']
  );
  assert.deepEqual(loadDict(path.join(dir, 'de.js')), { a: 'Ä' });
});

test('listLocales excludes en', () => {
  const dir = makeTmpI18nDir({ de: `{}`, fr: `{}` });

  assert.deepEqual(listLocales(dir), ['de', 'fr']);
});

test('parseLocaleFile records key order, blank-line grouping and comments', () => {
  const entries = parseLocaleFile(
    [
      `/* SPDX-License-Identifier: MPL-2.0 */`,
      ``,
      `'use strict';`,
      ``,
      `module.exports = {`,
      `  a: 'A',`,
      ``,
      `  // --- section`,
      `  b: 'B',`,
      `  /* =====`,
      `   * block`,
      `   * ===== */`,
      `  'dotted.key': 'C',`,
      `};`
    ].join('\n')
  );

  assert.deepEqual(
    entries.map((e) => e.key),
    ['a', 'b', 'dotted.key']
  );
  assert.deepEqual(
    entries.map((e) => e.blankBefore),
    [false, true, false]
  );
  assert.deepEqual(entries[1].comments, ['  // --- section']);
  assert.deepEqual(entries[2].comments, ['  /* =====', '   * block', '   * ===== */']);
});

test('mergeLayout keeps the locale comments and inherits English ones for new keys', () => {
  const enLayout = [
    { key: 'a', blankBefore: false, comments: ['  // english a'] },
    { key: 'b', blankBefore: true, comments: ['  // english b'] }
  ];
  const localeLayout = [{ key: 'a', blankBefore: true, comments: ['  // deutsch a'] }];

  const merged = mergeLayout(enLayout, localeLayout);

  assert.deepEqual(merged[0], { key: 'a', blankBefore: false, comments: ['  // deutsch a'] });
  assert.deepEqual(merged[1], { key: 'b', blankBefore: true, comments: ['  // english b'] });
});

test('serializeLocaleSource emits the SPDX header and skips keys absent from the dictionary', () => {
  const source = serializeLocaleSource({ a: 'A' }, [
    { key: 'a', blankBefore: false, comments: [] },
    { key: 'gone', blankBefore: true, comments: ['  // dropped'] }
  ]);

  assert.match(source, /^\/\* SPDX-License-Identifier: MPL-2\.0 \*\/\n\n'use strict';/);
  assert.doesNotMatch(source, /gone|dropped/);
});

test('serializeLocaleSource writes every key when the layout covers none of them', () => {
  const source = serializeLocaleSource({ a: 'A', b: 'B' }, []);

  assert.match(source, /"a": "A"/);
  assert.match(source, /"b": "B"/);
});

for (const locale of listLocales(I18N_DIR)) {
  test(`src/i18n/${locale}.js is in sync with en.js`, async () => {
    const result = await syncLocale(locale, { check: true });

    assert.deepEqual(
      result.added,
      [],
      `keys missing from ${locale}.js: ${result.added.join(', ')}`
    );
    assert.deepEqual(
      result.removed,
      [],
      `keys in ${locale}.js that en.js no longer has: ${result.removed.join(', ')}`
    );
    assert.equal(result.changed, false, `run \`npm run i18n:sync\` to update ${locale}.js`);
  });

  test(`src/i18n/${locale}.js survives a serialize round-trip unchanged`, async () => {
    const enPath = path.join(I18N_DIR, 'en.js');
    const filePath = path.join(I18N_DIR, `${locale}.js`);
    const layout = mergeLayout(readLayout(enPath), readLayout(filePath));
    const source = await formatWithPrettier(
      serializeLocaleSource(loadDict(filePath), layout),
      filePath
    );

    assert.equal(source, fs.readFileSync(filePath, 'utf8'));
  });
}
