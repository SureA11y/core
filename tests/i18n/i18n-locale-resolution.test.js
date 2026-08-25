'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

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
function makeResolveLocale(i18n, knownLocales) {
  const source = [
    'getSuppliedMessages',
    'ownDict',
    'lookupDict',
    'matchIgnoringCase',
    'findLocaleKey',
    'ownString',
    'matchLocale',
    'isKnownLocale',
    'resolveLocale'
  ]
    .map(liftFunction)
    .concat('return resolveLocale;')
    .join('\n');

  return new Function('I18N', 'KNOWN_LOCALES', 'normalizeLocale', source)(
    i18n,
    knownLocales || Object.keys(i18n || {}),
    (locale) => (typeof locale === 'string' && locale.trim() ? locale.trim() : 'en')
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

test('every engine copy in the generated core carries resolveLocale', () => {
  const core = fs.readFileSync(path.join(ROOT_DIR, 'src', 'core.js'), 'utf8');

  // Two engine copies: the module scope runDomRulesInPage runs against, and
  // runa11yCoreInPage's self-contained body. The cross-frame IIFE scans its
  // own frame through runa11yCoreInPage rather than carrying a third copy.
  assert.equal(core.split('function resolveLocale(').length - 1, 2);
});

test('the browser bundle resolves locales on its own', () => {
  // The bundle is minified, so its identifiers are gone and only behaviour is
  // left to assert against -- which is the better question anyway: loaded
  // alone into a page, with nothing else present, does it still resolve a
  // locale and report what it resolved?
  const dom = new JSDOM('<!doctype html><html><head><title>t</title></head><body></body></html>', {
    url: 'https://example.test/',
    runScripts: 'outside-only'
  });

  dom.window.eval(fs.readFileSync(path.join(ROOT_DIR, 'surea11y.browser.js'), 'utf8'));

  // The result comes from the jsdom realm, so copy it into a plain object of
  // this one before comparing -- a strict deep-equal weighs prototypes too.
  const scan = (engineOptions) => {
    const { requested, resolved, reason } = dom.window.a11ycore.runa11yCoreInPage(
      'https://example.test/',
      null,
      engineOptions,
      { includeRuleIds: ['page-title-present'] }
    ).engine.locale;
    return { requested, resolved, reason };
  };

  assert.deepEqual(scan({}), { requested: 'en', resolved: 'en', reason: 'ok' });
  assert.deepEqual(scan({ locale: 'de' }), {
    requested: 'de',
    resolved: 'en',
    reason: 'dictionary-not-loaded'
  });
  assert.deepEqual(scan({ locale: 'qqq' }), {
    requested: 'qqq',
    resolved: 'en',
    reason: 'unknown-locale'
  });
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

// A bare property lookup would accept inherited names and report one as the
// locale in use, which is exactly what engine.locale exists to rule out.
for (const inherited of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty']) {
  test(`engine.locale does not treat "${inherited}" as a locale`, () => {
    assert.deepEqual(localeOf({ locale: inherited }), {
      requested: inherited,
      resolved: 'en',
      reason: 'unknown-locale'
    });
  });
}

test('a supplied messages bag does not expose inherited names as dictionaries', () => {
  assert.deepEqual(localeOf({ locale: '__proto__', messages: {} }), {
    requested: '__proto__',
    resolved: 'en',
    reason: 'unknown-locale'
  });
});

test('a supplied dictionary that is not a plain object is ignored', () => {
  for (const bad of [['a'], 'text', 42, null]) {
    assert.deepEqual(
      localeOf({ locale: 'xx', messages: { xx: bad } }),
      { requested: 'xx', resolved: 'en', reason: 'unknown-locale' },
      `messages.xx = ${JSON.stringify(bad)} should be ignored`
    );
  }
});

test('a messages value that is not a plain object is ignored', () => {
  for (const bad of [['de'], 'de', 42]) {
    assert.deepEqual(localeOf({ locale: 'de', messages: bad }), {
      requested: 'de',
      resolved: 'de',
      reason: 'ok'
    });
  }
});

test('a supplied dictionary wins over the built-in one', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' }, de: { a: 'Ä' } });

  assert.deepEqual(resolveLocale({ locale: 'de', messages: { de: { a: 'own' } } }), {
    requested: 'de',
    resolved: 'de',
    reason: 'ok'
  });
});

test('a supplied dictionary makes an otherwise unknown locale resolve', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' } }, ['en', 'de']);

  assert.deepEqual(resolveLocale({ locale: 'zz', messages: { zz: { a: 'Z' } } }), {
    requested: 'zz',
    resolved: 'zz',
    reason: 'ok'
  });
});

test('a locale the project ships but this build omits reports dictionary-not-loaded', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' } }, ['en', 'de']);

  assert.deepEqual(resolveLocale({ locale: 'de' }), {
    requested: 'de',
    resolved: 'en',
    reason: 'dictionary-not-loaded'
  });
});

test('a subtag of a shipped-but-omitted locale also reports dictionary-not-loaded', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' } }, ['en', 'de']);

  assert.equal(resolveLocale({ locale: 'de-DE' }).reason, 'dictionary-not-loaded');
});

test('a code differing only in case is not reported as a fallback', () => {
  assert.deepEqual(localeOf({ locale: 'DE' }), {
    requested: 'DE',
    resolved: 'de',
    reason: 'ok'
  });
});

// Locale tags are case-insensitive, so a regional file has to be reachable
// however the caller spells it.
test('a regional dictionary is found whatever the case of the request', () => {
  const i18n = { en: { a: 'A' }, 'pt-BR': { a: 'A-BR' } };

  for (const requested of ['pt-BR', 'pt-br', 'PT-BR', 'Pt-Br']) {
    assert.deepEqual(
      makeResolveLocale(i18n)({ locale: requested }),
      { requested, resolved: 'pt-BR', reason: 'ok' },
      `${requested} should find pt-BR`
    );
  }
});

test('a regional request still falls back to its base language when present', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' }, pt: { a: 'A-PT' } });

  assert.deepEqual(resolveLocale({ locale: 'pt-BR' }), {
    requested: 'pt-BR',
    resolved: 'pt',
    reason: 'primary-subtag'
  });
});

test('a base-language request does not match a regional dictionary', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' }, 'pt-BR': { a: 'A-BR' } });

  assert.equal(resolveLocale({ locale: 'pt' }).reason, 'unknown-locale');
});

test('a supplied dictionary is matched case-insensitively too', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A' } }, ['en']);

  assert.deepEqual(resolveLocale({ locale: 'ZH-hant', messages: { 'zh-Hant': { a: 'Z' } } }), {
    requested: 'ZH-hant',
    resolved: 'zh-Hant',
    reason: 'ok'
  });
});

// Overriding one string must not cost the caller the rest of that language.
test('a partial supplied dictionary layers over the built-in one', () => {
  const html =
    '<!doctype html><html><head><title>t</title></head><body><img src="x.png"></body></html>';
  const imgRule = (engineOptions) =>
    runa11yCoreOnHtml(html, { engineOptions }).checksResults.find(
      (r) => r.ruleId === 'img-alt-present'
    );

  const plain = imgRule({ locale: 'de' });
  const overridden = imgRule({
    locale: 'de',
    messages: { de: { img_altPresent_title: 'HIJACKED' } }
  });

  assert.equal(overridden.title, 'HIJACKED');
  assert.equal(overridden.description, plain.description, 'other German strings survive');
  assert.notEqual(plain.description, '');
});

test('a partial supplied dictionary does not make the locale look incomplete', () => {
  assert.equal(
    localeOf({ locale: 'de', messages: { de: { img_altPresent_title: 'X' } } }).reason,
    'ok'
  );
});

test('resolveLocale counts supplied and built-in keys together for completeness', () => {
  const resolveLocale = makeResolveLocale({ en: { a: 'A', b: 'B' }, de: { a: 'Ä' } });

  assert.equal(resolveLocale({ locale: 'de' }).reason, 'partial-dictionary');
  assert.equal(
    resolveLocale({ locale: 'de', messages: { de: { b: 'Bö' } } }).reason,
    'ok',
    'the supplied key completes the built-in dictionary'
  );
});
