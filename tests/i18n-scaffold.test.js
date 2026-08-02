'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { generateScaffoldSource, scaffoldLocale } = require('../scripts/i18n-scaffold.js');

function makeTmpI18nDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-scaffold-test-'));
  fs.writeFileSync(
    path.join(dir, 'en.js'),
    `'use strict';\nmodule.exports = { greeting: 'Hello', 'dotted.key': 'World' };\n`
  );
  return dir;
}

test('generateScaffoldSource emits every en.js key with the English value as a placeholder', () => {
  const source = generateScaffoldSource({ foo_title: 'Foo', 'a.b': 'Bar' });
  assert.match(source, /^'use strict';/);
  assert.match(source, /module\.exports = \{/);

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-scaffold-source-test-'));
  const filePath = path.join(dir, 'generated.js');
  fs.writeFileSync(filePath, source);
  assert.deepEqual(require(filePath), { foo_title: 'Foo', 'a.b': 'Bar' });
});

test('scaffoldLocale writes a file with the same key count as en.js', async () => {
  const dir = makeTmpI18nDir();
  const { outPath, keyCount } = await scaffoldLocale('de', { i18nDir: dir });

  assert.equal(keyCount, 2);
  assert.ok(fs.existsSync(outPath));

  delete require.cache[require.resolve(outPath)];
  const written = require(outPath);
  assert.deepEqual(written, { greeting: 'Hello', 'dotted.key': 'World' });
});

test('scaffoldLocale refuses to overwrite an existing locale file without --force', async () => {
  const dir = makeTmpI18nDir();
  await scaffoldLocale('de', { i18nDir: dir });

  await assert.rejects(() => scaffoldLocale('de', { i18nDir: dir }), /already exists/);
});

test('scaffoldLocale overwrites when force is true', async () => {
  const dir = makeTmpI18nDir();
  await scaffoldLocale('de', { i18nDir: dir });
  fs.writeFileSync(
    path.join(dir, 'de.js'),
    `'use strict';\nmodule.exports = { stale: 'value' };\n`
  );

  const { outPath } = await scaffoldLocale('de', { i18nDir: dir, force: true });

  delete require.cache[require.resolve(outPath)];
  const written = require(outPath);
  assert.deepEqual(written, { greeting: 'Hello', 'dotted.key': 'World' });
});

test('scaffoldLocale rejects "en" as a target locale', async () => {
  const dir = makeTmpI18nDir();
  await assert.rejects(() => scaffoldLocale('en', { i18nDir: dir }), /canonical source/);
});

test('scaffoldLocale rejects a malformed locale code', async () => {
  const dir = makeTmpI18nDir();
  await assert.rejects(
    () => scaffoldLocale('not a locale!', { i18nDir: dir }),
    /doesn't look like a locale code/
  );
});
