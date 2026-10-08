'use strict';

// engineOptions are checked against one table (src/core/engine-options.js):
// with strictOptions, a key the engine doesn't read or a value of the wrong
// type throws INVALID_ENGINE_OPTIONS; without it, a key that looks like a
// typo of a known one is warned about, and the scan runs as before.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const { engineOptionSpec, checkEngineOptions } = require('../src/core/engine-options.js');

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>x</main></body></html>';

function scan(engineOptions) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    return { result: runa11yCoreOnHtml(PAGE, { engineOptions }), warnings };
  } finally {
    console.warn = warn;
  }
}

test('a typo of a known option is warned about, and the scan runs as before', () => {
  const { result, warnings } = scan({
    lcoale: 'de',
    includeShadowDOM: true,
    output: { includeHtm: false },
    rules: { includ: ['region'] },
    acmeSetting: 1
  });
  assert.equal(result.engine.locale.resolved, 'en');
  const said = [...new Set(warnings.filter((w) => w.includes('unknown option')))];
  assert.deepEqual(said, [
    '[surea11y] engineOptions: unknown option "lcoale" (did you mean "locale"?); ignored.',
    '[surea11y] engineOptions: unknown option "includeShadowDOM" (did you mean "includeShadowDom"?); ignored.',
    '[surea11y] engineOptions: unknown option "output.includeHtm" (did you mean "output.includeHtml"?); ignored.',
    '[surea11y] engineOptions: unknown option "rules.includ" (did you mean "rules.include"?); ignored.'
  ]);
  // A key close to nothing may be a custom rule's own setting: no word.
  assert.ok(!warnings.some((w) => w.includes('acmeSetting')));
});

test('strictOptions throws on every unknown key and invalid value, naming each', () => {
  assert.throws(
    () =>
      scan({
        strictOptions: true,
        lcoale: 'de',
        contrast: { mode: 'strict' },
        includeHiddenElements: 'yes',
        frameWaitTime: -1
      }),
    (err) => {
      assert.equal(err.code, 'INVALID_ENGINE_OPTIONS');
      assert.equal(
        err.message,
        'engineOptions: unknown option "lcoale" (did you mean "locale"?); contrast.mode must be one of "strictConformance", "auditorAssist", not "strict"; includeHiddenElements must be true or false, not "yes"; frameWaitTime must be a number of milliseconds, 0 or more, not -1. (strictOptions)'
      );
      assert.deepEqual(
        err.problems.map((p) => [p.path, p.kind, p.suggestion]),
        [
          ['lcoale', 'unknown', 'locale'],
          ['contrast.mode', 'invalid', null],
          ['includeHiddenElements', 'invalid', null],
          ['frameWaitTime', 'invalid', null]
        ]
      );
      return true;
    }
  );
  // Any unknown key, not only a near one.
  assert.throws(() => scan({ strictOptions: true, acmeSetting: 1 }), {
    code: 'INVALID_ENGINE_OPTIONS',
    message: 'engineOptions: unknown option "acmeSetting". (strictOptions)'
  });
});

test('strictOptions accepts every option the engine reads, in each documented form', () => {
  const { result } = scan({
    strictOptions: true,
    locale: 'de',
    wcagVersion: '2.1',
    mappings: 'en301549',
    optInRules: ['all'],
    logUntestedWcag: false,
    messages: { de: { anything: 'x' } },
    includeHiddenElements: false,
    includeShadowDom: true,
    fragment: false,
    excludeSelectors: '.ad, .banner',
    timestamp: '2026-10-08T00:00:00Z',
    contrast: { mode: 'auditorAssist', rootCanvasFallback: '#fff' },
    visibilityMode: 'styleOnly',
    policyContract: 'a11y',
    policy: { coerceManualFailToCantTell: true },
    output: { includeSelector: true, includeHtml: false },
    rules: { exclude: ['region'], 'img-alt-present': { anySetting: 1 } },
    tags: { exclude: 'best-practice' },
    tests: ['img-alt-present', 'region'],
    customRules: [],
    probes: { anything: [1, 2] },
    perfStats: false,
    profileRules: false,
    pingWaitTime: 500,
    frameWaitTime: 0,
    includeMode: 'or'
  });
  assert.equal(result.engine.locale.resolved, 'de');
});

test('the option table, the TypeScript types and ENGINE_OPTIONS.md name the same options', () => {
  const spec = Object.keys(engineOptionSpec()).sort();
  const dts = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.d.ts'), 'utf8');
  const start = dts.indexOf('export interface EngineOptionFields {');
  const body = dts.slice(start, dts.indexOf('\n}', start));
  const typed = [...body.matchAll(/^ {2}(\w+)\?:/gm)].map((m) => m[1]).sort();
  assert.deepEqual(typed, spec);

  const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'ENGINE_OPTIONS.md'), 'utf8');
  assert.deepEqual(
    spec.filter((k) => !doc.includes('`' + k)),
    [],
    'every option is documented'
  );
});

test('a key is only matched to a known one when it is close', () => {
  const unknown = (o) => checkEngineOptions(o).map((p) => p.suggestion);
  assert.deepEqual(unknown({ lcoale: 1, locales: 1, LOCALE: 1, lang: 1, mode: 1, tag: 1 }), [
    'locale',
    'locale',
    'locale',
    null,
    null,
    'tags'
  ]);
});
