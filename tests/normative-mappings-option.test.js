'use strict';

/**
 * engineOptions.mappings: a scan result names WCAG and nothing else unless
 * the caller asks for another standard, by name or by version, or targets it
 * through a profile. The catalog keeps every mapping regardless.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
  '<img src="a.png"></main></body></html>';

function captureWarnings(fn) {
  const original = console.warn;
  const warnings = [];
  console.warn = (msg) => warnings.push(String(msg));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = original;
  }
}

function scan(engineOptions) {
  return runa11yCoreOnHtml(HTML, { engineOptions });
}

// "WCAG" or "EN 301 549 V3.2.1" for each entry of a result's mappings.
function standards(result) {
  return result.meta.normativeMappings.map((m) =>
    m.standard === 'EN 301 549' ? `${m.standard} ${m.version}` : m.standard
  );
}

const atomic = (r) => r.checksResults.find((c) => c.ruleId === 'img-alt-present');
const composite = (r) => r.rulesResults.find((c) => c.ruleId.startsWith('wcag-1.1.1-'));

test('by default a result carries only its WCAG entries and no engine.mappings', () => {
  const result = scan({});
  assert.deepEqual(standards(atomic(result)), ['WCAG']);
  assert.deepEqual(standards(composite(result)), ['WCAG']);
  assert.equal('mappings' in result.engine, false);
  const every = result.checksResults.concat(result.rulesResults);
  assert.ok(every.every((r) => standards(r).every((s) => s === 'WCAG')));
});

test('naming a standard adds every version of it', () => {
  const result = scan({ mappings: ['en301549'] });
  const expected = ['WCAG', 'EN 301 549 V3.2.1', 'EN 301 549 V4.1.1'];
  assert.deepEqual(standards(atomic(result)), expected);
  assert.deepEqual(standards(composite(result)), expected);
  assert.deepEqual(result.engine.mappings, ['en301549']);
});

test('naming a version adds only that version', () => {
  const result = scan({ mappings: 'en301549:V3.2.1' });
  assert.deepEqual(standards(atomic(result)), ['WCAG', 'EN 301 549 V3.2.1']);
  assert.deepEqual(standards(composite(result)), ['WCAG', 'EN 301 549 V3.2.1']);
  assert.deepEqual(result.engine.mappings, ['en301549:V3.2.1']);
});

test('names and versions are matched case-insensitively and reported canonically', () => {
  const result = scan({ mappings: ' EN301549:v4.1.1 , en301549:V3.2.1' });
  assert.deepEqual(result.engine.mappings, ['en301549:V3.2.1', 'en301549:V4.1.1']);
});

test('a whole standard absorbs a version of it named alongside', () => {
  assert.deepEqual(scan({ mappings: 'en301549:V4.1.1, en301549' }).engine.mappings, ['en301549']);
});

test('an EN 301 549 profile switches on the clauses of the version it targets', () => {
  const v4 = scan({ profile: 'en301549-v4.1.1' });
  assert.deepEqual(standards(atomic(v4)), ['WCAG', 'EN 301 549 V4.1.1']);
  assert.deepEqual(v4.engine.mappings, ['en301549:V4.1.1']);

  const v3 = scan({ profile: 'en301549-v3.2.1' });
  assert.deepEqual(standards(atomic(v3)), ['WCAG', 'EN 301 549 V3.2.1']);
  assert.deepEqual(v3.engine.mappings, ['en301549:V3.2.1']);
});

test('a profile adds to engineOptions.mappings rather than replacing it', () => {
  const result = scan({ profile: 'en301549-v4.1.1', mappings: 'en301549:V3.2.1' });
  assert.deepEqual(result.engine.mappings, ['en301549:V3.2.1', 'en301549:V4.1.1']);
});

test('a profile not named after a standard switches nothing on', () => {
  for (const profile of ['wcag22-aa', 'section508']) {
    const result = scan({ profile });
    assert.deepEqual(standards(atomic(result)), ['WCAG'], profile);
    assert.equal('mappings' in result.engine, false, profile);
  }
});

test('a profile that did not apply implies no mappings', () => {
  const { value } = captureWarnings(() =>
    scan({ profile: 'en301549-v4.1.1', tags: { include: 'wcag111' } })
  );
  assert.equal('mappings' in value.engine, false);
  assert.deepEqual(standards(atomic(value)), ['WCAG']);
});

test("naming rgaa adds each rule's RGAA tests, with their criterion", () => {
  const result = scan({ mappings: ['rgaa'] });
  assert.deepEqual(result.engine.mappings, ['rgaa']);
  const rgaa = atomic(result).meta.normativeMappings.filter((m) => m.standard === 'RGAA');
  assert.ok(rgaa.length > 0);
  for (const m of rgaa) {
    assert.equal(m.version, '4.1.2');
    assert.match(m.requirement, /^\d+\.\d+\.\d+$/);
    assert.ok(m.requirement.startsWith(`${m.criterion}.`));
    assert.deepEqual(m.wcagSc, ['1.1.1']);
  }
  assert.ok(composite(result).meta.normativeMappings.some((m) => m.standard === 'RGAA'));
  // EN 301 549 stays off unless asked for too.
  assert.ok(!atomic(result).meta.normativeMappings.some((m) => m.standard === 'EN 301 549'));
});

test('an unknown standard or version is ignored with a warning', () => {
  const { value, warnings } = captureWarnings(() =>
    scan({ mappings: ['bitv', 'en301549:V9.9.9', 'en301549:V3.2.1'] })
  );
  assert.deepEqual(value.engine.mappings, ['en301549:V3.2.1']);
  assert.ok(
    warnings.some(
      (w) =>
        w.includes('engineOptions.mappings') &&
        w.includes('"bitv"') &&
        w.includes('"en301549:V9.9.9"')
    )
  );
});

test('a custom rule keeps exactly the mappings it declares', () => {
  const declared = [
    { standard: 'WCAG', requirement: '1.1.1', level: 'A' },
    { standard: 'EN 301 549', version: 'V3.2.1', requirement: '9.1.1.1' }
  ];
  const rule = {
    id: 'probe-declared-mappings',
    meta: { title: 'Probe', normativeMappings: declared },
    runInPage: function () {
      return { outcome: 'pass', occurrences: [] };
    }.toString()
  };
  const result = scan({ customRules: [rule] });
  const found = result.checksResults.find((r) => r.ruleId === 'probe-declared-mappings');
  assert.deepEqual(
    found.meta.normativeMappings.map((m) => `${m.standard}|${m.requirement}`),
    ['WCAG|1.1.1', 'EN 301 549|9.1.1.1']
  );
});

test('the catalogs carry every mapping whatever the scan options', () => {
  const versions = (list) => list.filter((m) => m.standard === 'EN 301 549').map((m) => m.version);
  const check = core.getChecksCatalog().find((r) => r.ruleId === 'img-alt-present');
  assert.deepEqual(versions(check.normativeMappings), ['V3.2.1', 'V4.1.1']);
  const rollup = core.getRulesCatalog().find((r) => r.id.startsWith('wcag-1.1.1-'));
  assert.deepEqual(versions(rollup.meta.standardMappings), ['V3.2.1', 'V4.1.1']);
});
