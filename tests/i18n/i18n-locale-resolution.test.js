'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('../helpers/runa11yCoreOnHtml');

const ROOT_DIR = path.join(__dirname, '..', '..');
const I18N_DIR = path.join(ROOT_DIR, 'src', 'i18n');

const LOCALES = fs
  .readdirSync(I18N_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace(/\.json$/, ''));

const html =
  '<!doctype html><html><head><title>t</title></head><body><img src="x.png"></body></html>';

function localeOf(engineOptions) {
  return runa11yCoreOnHtml(html, { engineOptions }).engine.locale;
}

const CORE_SOURCE = fs.readFileSync(path.join(ROOT_DIR, 'src', 'core.js'), 'utf8');

function liftFunction(name) {
  const match = new RegExp(`^function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, 'm').exec(
    CORE_SOURCE
  );
  assert.ok(match, `${name} is not present in the built src/core.js`);
  return match[0];
}

// These close over the inlined I18N table, so they are lifted out of the built
// engine to be exercised against dictionaries the shipped locales cannot
// produce.
function makeResolveLocale(i18n) {
  const source = `${liftFunction('matchLocale')}\n${liftFunction('resolveLocale')}\nreturn resolveLocale;`;

  return new Function('I18N', 'normalizeLocale', source)(i18n, (locale) =>
    typeof locale === 'string' && locale.trim() ? locale.trim() : 'en'
  );
}

test('engine.locale sits alongside the other engine fields', () => {
  const engine = runa11yCoreOnHtml(html, { engineOptions: {} }).engine;

  assert.equal(typeof engine.tag, 'string');
  assert.equal(typeof engine.schemaVersion, 'string');
  assert.deepEqual(Object.keys(engine.locale).sort(), ['reason', 'requested', 'resolved']);
});

test('engine.locale defaults to English when no locale is requested', () => {
  assert.deepEqual(localeOf({}), { requested: 'en', resolved: 'en', reason: 'ok' });
});

test('engine.locale treats a blank locale as English', () => {
  assert.deepEqual(localeOf({ locale: '   ' }), { requested: 'en', resolved: 'en', reason: 'ok' });
  assert.deepEqual(localeOf({ locale: 42 }), { requested: 'en', resolved: 'en', reason: 'ok' });
});

for (const locale of ['en', ...LOCALES]) {
  test(`engine.locale reports ${locale} as resolved in full`, () => {
    assert.deepEqual(localeOf({ locale }), { requested: locale, resolved: locale, reason: 'ok' });
  });
}

test('engine.locale reports the fallback for a locale the build does not carry', () => {
  assert.deepEqual(localeOf({ locale: 'ja' }), {
    requested: 'ja',
    resolved: 'en',
    reason: 'unknown-locale'
  });
});

test('engine.locale falls back from a subtag to its primary language', () => {
  assert.deepEqual(localeOf({ locale: 'de-DE' }), {
    requested: 'de-DE',
    resolved: 'de',
    reason: 'primary-subtag'
  });
});

test('engine.locale matches the primary subtag regardless of case', () => {
  assert.deepEqual(localeOf({ locale: 'DE-de' }), {
    requested: 'DE-de',
    resolved: 'de',
    reason: 'primary-subtag'
  });
});

test('engine.locale still reports unknown when the primary language is absent too', () => {
  assert.deepEqual(localeOf({ locale: 'pt-BR' }), {
    requested: 'pt-BR',
    resolved: 'en',
    reason: 'unknown-locale'
  });
});

test('a subtag fallback returns the primary language strings, not English', () => {
  const html =
    '<!doctype html><html><head><title>t</title></head><body><div role="generic">x</div></body></html>';
  const hintFor = (locale) =>
    runa11yCoreOnHtml(html, { engineOptions: { locale } }).checksResults.find(
      (r) => r.ruleId === 'aria-deprecated-role'
    ).occurrences[0].hint;

  assert.equal(hintFor('de-DE'), hintFor('de'));
  assert.notEqual(hintFor('de-DE'), hintFor('en'));
});

test('engine.locale does not change the strings a run produces', () => {
  const withUnknown = runa11yCoreOnHtml(html, { engineOptions: { locale: 'ja' } });
  const withEnglish = runa11yCoreOnHtml(html, { engineOptions: { locale: 'en' } });

  assert.deepEqual(
    withUnknown.checksResults.map((r) => r.title),
    withEnglish.checksResults.map((r) => r.title)
  );
});

test('resolveLocale reports a dictionary that is missing keys as partial', () => {
  const resolveLocale = makeResolveLocale({
    en: { a: 'A', b: 'B' },
    de: { a: 'Ä' }
  });

  assert.deepEqual(resolveLocale({ locale: 'de' }), {
    requested: 'de',
    resolved: 'de',
    reason: 'partial-dictionary'
  });
});

test('resolveLocale reports a complete dictionary as ok even when values match English', () => {
  const resolveLocale = makeResolveLocale({
    en: { a: 'A', b: 'B' },
    de: { a: 'A', b: 'B' }
  });

  assert.deepEqual(resolveLocale({ locale: 'de' }), {
    requested: 'de',
    resolved: 'de',
    reason: 'ok'
  });
});

test('resolveLocale falls back to English when no table was inlined at all', () => {
  const resolveLocale = makeResolveLocale(undefined);

  assert.deepEqual(resolveLocale({ locale: 'de' }), {
    requested: 'de',
    resolved: 'en',
    reason: 'unknown-locale'
  });
});

test('every engine copy carries resolveLocale', () => {
  const core = fs.readFileSync(path.join(ROOT_DIR, 'src', 'core.js'), 'utf8');
  const bundle = fs.readFileSync(path.join(ROOT_DIR, 'surea11y.browser.js'), 'utf8');

  assert.equal(core.split('function resolveLocale(').length - 1, 3);
  assert.equal(bundle.split('function resolveLocale(').length - 1, 1);
});

test('resolveLocale prefers an exact match over the primary subtag', () => {
  const resolveLocale = makeResolveLocale({
    en: { a: 'A' },
    de: { a: 'Ä' },
    'de-DE': { a: 'Ä-DE' }
  });

  assert.deepEqual(resolveLocale({ locale: 'de-DE' }), {
    requested: 'de-DE',
    resolved: 'de-DE',
    reason: 'ok'
  });
});

test('resolveLocale reports a partial primary dictionary reached through a subtag', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A', b: 'B' }, de: { a: 'Ä' } });

  assert.deepEqual(resolveLocale({ locale: 'de-DE' }), {
    requested: 'de-DE',
    resolved: 'de',
    reason: 'partial-dictionary'
  });
});

test('resolveLocale handles a subtag with more than one part', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' }, de: { a: 'Ä' } });

  assert.deepEqual(resolveLocale({ locale: 'de-DE-1996' }), {
    requested: 'de-DE-1996',
    resolved: 'de',
    reason: 'primary-subtag'
  });
});

test('resolveLocale treats an English subtag as a fallback to English', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' } });

  assert.deepEqual(resolveLocale({ locale: 'en-GB' }), {
    requested: 'en-GB',
    resolved: 'en',
    reason: 'primary-subtag'
  });
});

test('resolveLocale does not treat a bare primary code as a subtag match', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' }, de: { a: 'Ä' } });

  assert.deepEqual(resolveLocale({ locale: 'de' }), {
    requested: 'de',
    resolved: 'de',
    reason: 'ok'
  });
});
