'use strict';

/**
 * What the register still listed after the seventh round (audits/FINDINGS.md
 * on audit/register), and the decisions taken on 2026-11-20: options the
 * engine read loosely or let through without a word.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('../src/testing.js');
const { packScript, definePack } = require('../src/pack.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>h</h1><img src="a.png"><a href="/x"></a></main></body></html>';

function quietly(fn) {
  const warnings = [];
  const warn = console.warn;
  console.warn = (m) => warnings.push(String(m));
  try {
    return { value: fn(), warnings };
  } catch (err) {
    return { error: err, warnings };
  } finally {
    console.warn = warn;
  }
}
const scan = (engineOptions, runOnly) =>
  quietly(() => runa11yCoreOnHtml(HTML, { engineOptions, runOnly }));

test('strictOptions refuses unknown mappings and optInRules tags and invalid excludeSelectors CSS (R4:OP-P2)', () => {
  for (const eo of [
    { mappings: ['nope'] },
    { optInRules: ['nope'] },
    { excludeSelectors: ['div[[['] },
    { rules: { 'img-alt-present': { excludeSelectors: ['a[['] } } }
  ]) {
    const strict = scan({ strictOptions: true, ...eo });
    assert.equal(strict.error && strict.error.code, 'INVALID_ENGINE_OPTIONS', JSON.stringify(eo));
    // Without strictOptions, a warning, and the scan runs.
    const loose = scan(eo);
    assert.ok(loose.value, JSON.stringify(eo));
    assert.equal(loose.warnings.length, 1, JSON.stringify(loose.warnings));
  }
  assert.ok(scan({ strictOptions: true, excludeSelectors: ['main img'] }).value);
});

test('an applicability that returns neither true nor false is an error, not run everywhere (R4:OP-P3)', () => {
  for (const v of [undefined, 0, Number.NaN, null, 'false']) {
    const rule = {
      id: 'org-x',
      meta: { title: 'T', description: 'd', tags: ['org'] },
      applicability: () => v,
      runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] })
    };
    const { value } = scan({ customRules: [rule] }, ['org-x']);
    const c = value.checksResults.find((x) => x.ruleId === 'org-x');
    assert.equal(c.outcome, 'cantTell', String(v));
    assert.match(c.error, /applicability returned .*; it must return true or false/, String(v));
  }
});

test('rootCanvasFallback refuses what is not an opaque color as CSS writes it (R4:OP-P4)', () => {
  for (const v of ['inherit', 'currentColor', 'initial', 'rgb(1,2,3,4,5)', 'rgb(1,2,3,)']) {
    assert.equal(scan({ contrast: { rootCanvasFallback: v } }).warnings.length, 1, v);
    assert.equal(
      scan({ strictOptions: true, contrast: { rootCanvasFallback: v } }).error.code,
      'INVALID_ENGINE_OPTIONS',
      v
    );
  }
  for (const v of [
    '#000',
    'black',
    'rgb(0 0 0)',
    'rgb(0 0 0 / 1)',
    'rgba(0,0,0,1)',
    'hsl(0 0% 0%)'
  ]) {
    assert.equal(scan({ contrast: { rootCanvasFallback: v } }).warnings.length, 0, v);
  }
});

test('packScript refuses rule code with "<!--", which can keep an inline script open (R4:OP-P5)', () => {
  const pack = definePack({
    name: 'html-comment-pack',
    version: '1.0.0',
    namespace: 'hc',
    core: '*',
    rules: [
      {
        id: 'hc-rule',
        meta: { title: 'T', description: 'd', tags: ['hc'] },
        runInPage: new Function("return { outcome: 'pass', note: '<!--<script' };")
      }
    ]
  });
  assert.throws(() => packScript([pack]), /contains "<!--"/);
});

test('a hole in an option list is refused as a null is (R4:OP-P6)', () => {
  /* eslint-disable no-sparse-arrays */
  for (const eo of [{ excludeSelectors: [, 'main'] }, { mappings: [,] }]) {
    /* eslint-enable no-sparse-arrays */
    assert.equal(scan({ strictOptions: true, ...eo }).error.code, 'INVALID_ENGINE_OPTIONS');
    assert.equal(scan(eo).warnings.length, 1);
  }
});

test('wcagVersion is read trimmed under strictOptions, as wcagLevel is (R4:SE)', () => {
  const { value, error } = scan({ strictOptions: true, wcagVersion: '2.1 ', wcagLevel: ' aA ' });
  assert.equal(error, undefined);
  assert.equal(value.engine.wcagVersion, '2.1');
});

test('rule ids match case in ASCII only: the Kelvin sign is no "k" (R4:SE)', () => {
  const kelvin = 'linK-name-present';
  assert.equal(scan({}, [kelvin]).error.code, 'INVALID_RUN_ONLY');
  assert.ok(scan({ rules: { include: [kelvin] } }).error);
  // Plain ASCII case still matches.
  assert.equal(scan({}, ['LINK-name-present']).value.checksResults.length, 1);
  const own = scan({ rules: { [kelvin]: { excludeSelectors: ['main'] } } });
  assert.match(own.warnings.join('\n'), /no rule named/);
});
