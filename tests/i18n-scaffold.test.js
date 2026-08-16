'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { serializeLocale, scaffoldLocale, loadDict } = require('../scripts/i18n-scaffold.js');

function makeTmpI18nDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-scaffold-test-'));
  fs.writeFileSync(
    path.join(dir, 'en.json'),
    JSON.stringify({ greeting: 'Hello', 'dotted.key': 'World' }, null, 2)
  );
  return dir;
}

test('serializeLocale writes two-space JSON with a trailing newline', () => {
  const source = serializeLocale({ a: 'A', b: 'B' });

  assert.equal(source, '{\n  "a": "A",\n  "b": "B"\n}\n');
});

test('serializeLocale preserves key order', () => {
  const source = serializeLocale({ c: 'C', a: 'A', b: 'B' });

  assert.deepEqual(Object.keys(JSON.parse(source)), ['c', 'a', 'b']);
});

test('scaffoldLocale writes every en.json key with the English value as a placeholder', () => {
  const dir = makeTmpI18nDir();
  const { outPath, keyCount } = scaffoldLocale('de', { i18nDir: dir });

  assert.equal(keyCount, 2);
  assert.equal(path.basename(outPath), 'de.json');
  assert.deepEqual(loadDict(outPath), { greeting: 'Hello', 'dotted.key': 'World' });
});

test('scaffoldLocale mirrors the key order of en.json', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-scaffold-order-test-'));
  fs.writeFileSync(
    path.join(dir, 'en.json'),
    JSON.stringify({ third: '3', first: '1', second: '2' }, null, 2)
  );

  const { outPath } = scaffoldLocale('de', { i18nDir: dir });

  assert.deepEqual(Object.keys(loadDict(outPath)), ['third', 'first', 'second']);
});

test('scaffoldLocale points at i18n:sync instead of overwriting an existing locale', () => {
  const dir = makeTmpI18nDir();
  scaffoldLocale('de', { i18nDir: dir });

  assert.throws(() => scaffoldLocale('de', { i18nDir: dir }), /i18n:sync/);
});

test('scaffoldLocale overwrites when force is true', () => {
  const dir = makeTmpI18nDir();
  scaffoldLocale('de', { i18nDir: dir });
  fs.writeFileSync(path.join(dir, 'de.json'), JSON.stringify({ stale: 'value' }));

  const { outPath } = scaffoldLocale('de', { i18nDir: dir, force: true });

  assert.deepEqual(loadDict(outPath), { greeting: 'Hello', 'dotted.key': 'World' });
});

test('scaffoldLocale rejects "en" as a target locale', () => {
  const dir = makeTmpI18nDir();

  assert.throws(() => scaffoldLocale('en', { i18nDir: dir }), /canonical source/);
});

test('scaffoldLocale rejects a malformed locale code', () => {
  const dir = makeTmpI18nDir();

  assert.throws(
    () => scaffoldLocale('not a locale!', { i18nDir: dir }),
    /doesn't look like a locale code/
  );
});
