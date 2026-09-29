'use strict';

/**
 * Opt-in rules: a rule tagged with a standard's ruleTag (src/coverage/
 * standards.js; RGAA's is `rgaa`) checks a requirement WCAG does not make, so
 * it runs only when a selection asks for it -- by that tag, by its id, or
 * through a profile that lists the tag. A default run or a WCAG tag set never
 * selects it, so a scan targeting WCAG never reports a failure WCAG does not
 * define. These use a custom rule, since the gate is the same for built-in
 * and runtime rules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../src/core.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';

const RGAA_ONLY = {
  id: 'probe-rgaa-only',
  meta: { title: 'Probe', tags: ['rgaa', 'atomic', 'automatic'] },
  runInPage: function () {
    return { outcome: 'fail', occurrences: [{ summary: 's', hint: 'h' }] };
  }.toString()
};

function ran(engineOptions = {}, runOnly) {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: { customRules: [RGAA_ONLY], ...engineOptions },
    ...(runOnly ? { runOnly } : {})
  });
  return result.checksResults.some((r) => r.ruleId === RGAA_ONLY.id);
}

test('a default run does not select an opt-in rule', () => {
  assert.equal(ran(), false);
});

test('a WCAG tag set or profile does not select it either', () => {
  assert.equal(ran({ tags: { include: 'wcag2a, wcag2aa, wcag21a, wcag21aa' } }), false);
  assert.equal(ran({ profile: 'wcag22-aa' }), false);
  assert.equal(ran({ profile: 'en301549-v4.1.1' }), false);
});

test('asking by its tag, by its id, or through the RGAA profile selects it', () => {
  assert.equal(ran({ tags: { include: 'rgaa' } }), true);
  assert.equal(ran({ rules: { include: 'probe-rgaa-only' } }), true);
  assert.equal(ran({}, { includeRuleIds: ['probe-rgaa-only'] }), true);
  assert.equal(ran({ profile: 'rgaa-4.1.2' }), true);
});

test('excludes still apply to an opt-in rule that was asked for', () => {
  assert.equal(ran({ profile: 'rgaa-4.1.2', rules: { exclude: 'probe-rgaa-only' } }), false);
  assert.equal(ran({ profile: 'rgaa-4.1.2' }, { excludeTags: ['rgaa'] }), false);
});

test('the rgaa-4.1.2 profile runs WCAG 2.1 A and AA, the rules RGAA maps, and the opt-in ones', () => {
  const wcag21 = core
    .getChecksForRunOnly({ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
    .map((r) => r.ruleId);
  const profile = core.getChecksForRunOnly(null, { profile: 'rgaa-4.1.2' }).map((r) => r.ruleId);
  for (const id of wcag21) assert.ok(profile.includes(id), id);
  // Rules with no WCAG mapping that RGAA tests: heading hierarchy, skip links.
  for (const id of ['heading-order', 'skip-link', 'landmark-one-main']) {
    assert.ok(!wcag21.includes(id) && profile.includes(id), id);
  }
  // A best-practice rule RGAA does not map stays out.
  assert.ok(!profile.includes('region'));
});

test('the rgaa-4.1.2 profile targets WCAG 2.1 and switches on the RGAA mapping', () => {
  const result = runa11yCoreOnHtml(HTML, { engineOptions: { profile: 'rgaa-4.1.2' } });
  assert.equal(result.engine.profile, 'rgaa-4.1.2');
  assert.equal(result.engine.wcagVersion, '2.1');
  assert.deepEqual(result.engine.mappings, ['rgaa:4.1.2']);
});
