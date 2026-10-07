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
const { NORMATIVE_STANDARDS } = require('../src/coverage/standards.js');

// Every registered standard's rule tag: what 'all' can unlock. RGAA's is one;
// other profiles may add theirs.
const RULE_TAGS = NORMATIVE_STANDARDS.map((s) => s.ruleTag).filter(Boolean);

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

// A standard's own rollup groups its opt-in rules, so naming the rollup asks
// for them; otherwise the rollup would run with every child missing.
test("naming a standard's own rollup runs the opt-in rules it groups", () => {
  const PAGE =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main><center>x</center></main></body></html>';
  const pick = (engineOptions, runOnly) =>
    runa11yCoreOnHtml(PAGE, { engineOptions, ...(runOnly ? { runOnly } : {}) });

  const byRules = pick({ rules: { include: 'rgaa-4.1.2-10.1' } });
  assert.deepEqual(byRules.checksResults.map((r) => r.ruleId).sort(), [
    'letters-spaced-with-spaces',
    'presentational-attributes-absent',
    'presentational-elements-absent'
  ]);
  assert.equal(byRules.rulesResults.find((r) => r.ruleId === 'rgaa-4.1.2-10.1').outcome, 'fail');

  const byRunOnly = pick({}, { includeRuleIds: ['rgaa-4.1.2-8.1'] });
  assert.deepEqual(byRunOnly.checksResults.map((r) => r.ruleId).sort(), [
    'doctype-position',
    'doctype-present',
    'doctype-valid'
  ]);
  assert.equal(byRunOnly.rulesResults[0].outcome, 'pass');

  const excluded = pick({
    rules: {
      include: 'rgaa-4.1.2-8.1',
      exclude: 'doctype-position, doctype-present, doctype-valid'
    }
  });
  assert.deepEqual(excluded.checksResults, []);
});

test('a WCAG rollup id does not unlock opt-in rules', () => {
  const optIn = new Set(
    core
      .getChecksCatalog({ optInRules: 'all' })
      .filter((c) => (c.tags || []).includes('rgaa'))
      .map((c) => c.ruleId)
  );
  for (const id of core.getRulesCatalog().map((c) => c.id)) {
    const selected = core.getChecksForRunOnly({ includeRuleIds: [id] }).map((c) => c.ruleId);
    assert.deepEqual(
      selected.filter((r) => optIn.has(r)),
      [],
      id
    );
  }
});

// The tag answers "what does RGAA require beyond WCAG": it runs the opt-in
// rules only. The profile is the RGAA audit and runs those and the rest.
test('the rgaa tag alone selects only the opt-in rules; the profile selects them and more', () => {
  const byTag = core.getChecksForRunOnly({ tags: ['rgaa'] }).map((c) => c.ruleId);
  const optIn = core
    .getChecksCatalog({ optInRules: 'all' })
    .filter((c) => (c.tags || []).includes('rgaa'))
    .map((c) => c.ruleId);
  assert.deepEqual(byTag.sort(), optIn.sort());
  const byProfile = core.getChecksForRunOnly(null, { profile: 'rgaa-4.1.2' }).map((c) => c.ruleId);
  for (const id of byTag) assert.ok(byProfile.includes(id), id);
  assert.ok(byProfile.length > byTag.length);
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
  // Rules with no WCAG mapping that RGAA tests: heading hierarchy, skip links,
  // tab order.
  for (const id of ['heading-order', 'skip-link', 'tabindex']) {
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

// --- engineOptions.optInRules ------------------------------------------------

function scan(engineOptions = {}, runOnly) {
  return runa11yCoreOnHtml(HTML, {
    engineOptions: { customRules: [RGAA_ONLY], ...engineOptions },
    ...(runOnly ? { runOnly } : {})
  });
}

function withWarnings(fn) {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    return { value: fn(), warnings };
  } finally {
    console.warn = original;
  }
}

test('optInRules unlocks opt-in rules in a default run, by "all" or by tag', () => {
  for (const optInRules of ['all', 'ALL', 'rgaa', 'RGAA', ['rgaa'], 'rgaa, all']) {
    assert.equal(ran({ optInRules }), true, JSON.stringify(optInRules));
  }
});

test('with optInRules "all" and nothing else, every built-in rule runs', () => {
  const result = runa11yCoreOnHtml(HTML, { engineOptions: { optInRules: 'all' } });
  assert.deepEqual(
    result.checksResults.map((r) => r.ruleId).sort(),
    core
      .getChecksCatalog()
      .map((r) => r.ruleId)
      .sort()
  );
});

test('optInRules does not widen a selection: a WCAG profile or tag set still runs WCAG rules only', () => {
  assert.equal(ran({ optInRules: 'all', profile: 'wcag22-aa' }), false);
  assert.equal(ran({ optInRules: 'all', tags: { include: 'wcag2a' } }), false);
  assert.equal(ran({ optInRules: 'all' }, { includeRuleIds: ['img-alt-present'] }), false);
  assert.equal(ran({ optInRules: 'all', tags: { include: 'atomic' } }), true);
});

test('only engineOptions.optInRules unlocks: optInTags in a caller runOnly does nothing', () => {
  assert.equal(ran({}, { optInTags: ['rgaa'], excludeTags: ['best-practice'] }), false);
  assert.equal(scan({}, { optInTags: ['rgaa'], excludeTags: ['x'] }).engine.optInRules, undefined);
});

test('excludes still apply to rules optInRules unlocked', () => {
  assert.equal(ran({ optInRules: 'all', rules: { exclude: 'probe-rgaa-only' } }), false);
  assert.equal(ran({ optInRules: 'all' }, { excludeTags: ['rgaa'] }), false);
});

test('engine.optInRules names the unlocked tags only when the unlock added a rule', () => {
  const all = scan({ optInRules: 'all' }).engine.optInRules;
  assert.ok(all.includes('rgaa'), JSON.stringify(all));
  assert.ok(
    all.every((t) => RULE_TAGS.includes(t)),
    JSON.stringify(all)
  );
  assert.deepEqual(scan({ optInRules: ['RGAA'] }).engine.optInRules, ['rgaa']);
  // Nothing unlocked ran: a WCAG profile selects none of them.
  assert.equal(scan({ optInRules: 'all', profile: 'wcag22-aa' }).engine.optInRules, undefined);
  // The RGAA profile, or naming the rule, runs it without the option, so the
  // option added nothing and the run still targets one standard.
  assert.equal(scan({ profile: 'rgaa-4.1.2' }).engine.optInRules, undefined);
  assert.equal(scan({ optInRules: 'all', profile: 'rgaa-4.1.2' }).engine.optInRules, undefined);
  assert.equal(
    scan({ optInRules: 'all', rules: { include: RGAA_ONLY.id } }).engine.optInRules,
    undefined
  );
  assert.equal(scan({}).engine.optInRules, undefined);
});

test('an unknown optInRules value is ignored with a warning naming the valid ones', () => {
  for (const optInRules of ['bitv', ['nope'], 42]) {
    const { value, warnings } = withWarnings(() => scan({ optInRules }));
    assert.equal(value.engine.optInRules, undefined, JSON.stringify(optInRules));
    assert.ok(!value.checksResults.some((r) => r.ruleId === RGAA_ONLY.id));
    assert.ok(
      warnings.some((w) =>
        /engineOptions\.optInRules: ignoring .*"all" or one of: .*\brgaa\b/.test(w)
      ),
      warnings.join('\n')
    );
  }
  // A known tag next to an unknown one still applies.
  const { value, warnings } = withWarnings(() => scan({ optInRules: 'rgaa, bitv' }));
  assert.deepEqual(value.engine.optInRules, ['rgaa']);
  assert.ok(warnings.some((w) => w.includes('"bitv"')));
  // false and an empty list mean "not asked", with no warning.
  for (const optInRules of [false, null, '', []]) {
    const quiet = withWarnings(() => scan({ optInRules }));
    assert.equal(quiet.value.engine.optInRules, undefined);
    assert.ok(!quiet.warnings.some((w) => w.includes('optInRules')), JSON.stringify(optInRules));
  }
});

test('optInRules adds RGAA rollups to the run and the catalog, but no RGAA numbers without mappings', () => {
  const plain = runa11yCoreOnHtml(HTML, { engineOptions: { optInRules: 'all' } });
  const rollups = plain.rulesResults.filter((r) => r.meta.standard === 'RGAA');
  assert.ok(rollups.length > 40);
  const rgaaEntries = (r) => r.meta.normativeMappings.filter((m) => m.standard === 'RGAA');
  assert.ok(plain.checksResults.every((r) => rgaaEntries(r).length === 0));
  assert.equal(plain.engine.mappings, undefined);

  const mapped = runa11yCoreOnHtml(HTML, {
    engineOptions: { optInRules: 'all', mappings: ['rgaa'] }
  });
  assert.ok(mapped.checksResults.some((r) => rgaaEntries(r).length > 0));

  const catalogRollups = (eo) =>
    core.getRulesCatalog(eo).filter((c) => c.meta && c.meta.standard === 'RGAA').length;
  assert.equal(catalogRollups({ optInRules: 'all' }), rollups.length);
  // As in the run, a WCAG profile's include leaves them out.
  assert.equal(catalogRollups({ optInRules: 'all', profile: 'wcag22-aa' }), 0);
  assert.equal(
    runa11yCoreOnHtml(HTML, {
      engineOptions: { optInRules: 'all', profile: 'wcag22-aa' }
    }).rulesResults.filter((r) => r.meta.standard === 'RGAA').length,
    0
  );
  assert.equal(catalogRollups({}), 0);
});
