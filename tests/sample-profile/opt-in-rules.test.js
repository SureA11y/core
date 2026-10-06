'use strict';

/**
 * Opt-in rules: a rule tagged with a standard's ruleTag (src/coverage/
 * standards.js) checks a requirement WCAG does not make, so it runs only when
 * a selection asks for it -- by that tag, by its id, or through a profile that
 * lists the tag. A default run or a WCAG tag set never selects it, so a scan
 * targeting WCAG never reports a failure WCAG does not define. Run against the
 * engine copy with the sample profile (tests/helpers/sampleEngine.js), whose
 * tag is `sample`; most use a custom rule, since the gate is the same for
 * built-in and runtime rules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { requireSample } = require('../helpers/sampleEngine');

const core = requireSample('src/core.js');
const { runa11yCoreOnHtml } = requireSample('tests/helpers/runDomRulesOnHtml.js');
const { NORMATIVE_STANDARDS } = requireSample('src/coverage/standards.js');

// Every registered standard's rule tag: what 'all' can unlock.
const RULE_TAGS = NORMATIVE_STANDARDS.map((s) => s.ruleTag).filter(Boolean);

const HTML =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>x</p></main></body></html>';

const SAMPLE_ONLY = {
  id: 'probe-sample-only',
  meta: { title: 'Probe', tags: ['sample', 'atomic', 'automatic'] },
  runInPage: function () {
    return { outcome: 'fail', occurrences: [{ summary: 's', hint: 'h' }] };
  }.toString()
};

function ran(engineOptions = {}, runOnly) {
  const result = runa11yCoreOnHtml(HTML, {
    engineOptions: { customRules: [SAMPLE_ONLY], ...engineOptions },
    ...(runOnly ? { runOnly } : {})
  });
  return result.checksResults.some((r) => r.ruleId === SAMPLE_ONLY.id);
}

test('a default run does not select an opt-in rule', () => {
  assert.equal(ran(), false);
});

test('a WCAG tag set or profile does not select it either', () => {
  assert.equal(ran({ tags: { include: 'wcag2a, wcag2aa, wcag21a, wcag21aa' } }), false);
  assert.equal(ran({ profile: 'wcag22-aa' }), false);
  assert.equal(ran({ profile: 'en301549-v4.1.1' }), false);
});

test("asking by its tag, by its id, or through its standard's profile selects it", () => {
  assert.equal(ran({ tags: { include: 'sample' } }), true);
  assert.equal(ran({ rules: { include: 'probe-sample-only' } }), true);
  assert.equal(ran({}, { includeRuleIds: ['probe-sample-only'] }), true);
  assert.equal(ran({ profile: 'sample-1.0' }), true);
});

// A standard's own rollup groups its opt-in rules, so naming the rollup asks
// for them; otherwise the rollup would run with every child missing.
test("naming a standard's own rollup runs the opt-in rules it groups", () => {
  const pick = (engineOptions, runOnly) =>
    runa11yCoreOnHtml(HTML, { engineOptions, ...(runOnly ? { runOnly } : {}) });

  const byRules = pick({ rules: { include: 'sample-1.0-S5' } });
  assert.deepEqual(
    byRules.checksResults.map((r) => r.ruleId),
    ['sample-title-length']
  );
  assert.equal(byRules.rulesResults.find((r) => r.ruleId === 'sample-1.0-S5').outcome, 'pass');

  const byRunOnly = pick({}, { includeRuleIds: ['sample-1.0-S6'] });
  assert.deepEqual(
    byRunOnly.checksResults.map((r) => r.ruleId),
    ['sample-statement-link']
  );
  assert.equal(byRunOnly.rulesResults[0].outcome, 'fail');

  const excluded = pick({
    rules: { include: 'sample-1.0-S5', exclude: 'sample-title-length' }
  });
  assert.deepEqual(excluded.checksResults, []);
});

test('a WCAG rollup id does not unlock opt-in rules', () => {
  const optIn = new Set(
    core
      .getChecksCatalog({ optInRules: 'all' })
      .filter((c) => (c.tags || []).includes('sample'))
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

// The tag answers "what does the standard require beyond WCAG": it runs the
// opt-in rules only. The profile is the audit and runs those and the rest.
test('the tag alone selects only the opt-in rules; the profile selects them and more', () => {
  const byTag = core.getChecksForRunOnly({ tags: ['sample'] }).map((c) => c.ruleId);
  const optIn = core
    .getChecksCatalog({ optInRules: 'all' })
    .filter((c) => (c.tags || []).includes('sample'))
    .map((c) => c.ruleId);
  assert.deepEqual(byTag.sort(), optIn.sort());
  const byProfile = core.getChecksForRunOnly(null, { profile: 'sample-1.0' }).map((c) => c.ruleId);
  for (const id of byTag) assert.ok(byProfile.includes(id), id);
  assert.ok(byProfile.length > byTag.length);
});

test('excludes still apply to an opt-in rule that was asked for', () => {
  assert.equal(ran({ profile: 'sample-1.0', rules: { exclude: 'probe-sample-only' } }), false);
  assert.equal(ran({ profile: 'sample-1.0' }, { excludeTags: ['sample'] }), false);
});

test('the sample-1.0 profile runs WCAG 2.1 A and AA, the rules the standard maps, and the opt-in ones', () => {
  const wcag21 = core
    .getChecksForRunOnly({ tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
    .map((r) => r.ruleId);
  const profile = core.getChecksForRunOnly(null, { profile: 'sample-1.0' }).map((r) => r.ruleId);
  for (const id of wcag21) assert.ok(profile.includes(id), id);
  // A rule with no WCAG mapping that the standard maps (mappedRules).
  assert.ok(!wcag21.includes('heading-order') && profile.includes('heading-order'));
  for (const id of ['sample-title-length', 'sample-statement-link', 'sample-contrast-enhanced']) {
    assert.ok(profile.includes(id), id);
  }
  // A best-practice rule the standard does not map stays out.
  assert.ok(!profile.includes('region'));
});

test('the sample-1.0 profile targets WCAG 2.1 and switches on its mapping', () => {
  const result = runa11yCoreOnHtml(HTML, { engineOptions: { profile: 'sample-1.0' } });
  assert.equal(result.engine.profile, 'sample-1.0');
  assert.equal(result.engine.wcagVersion, '2.1');
  assert.deepEqual(result.engine.mappings, ['sample:1.0']);
});

// --- engineOptions.optInRules ------------------------------------------------

function scan(engineOptions = {}, runOnly) {
  return runa11yCoreOnHtml(HTML, {
    engineOptions: { customRules: [SAMPLE_ONLY], ...engineOptions },
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
  for (const optInRules of ['all', 'ALL', 'sample', 'SAMPLE', ['sample'], 'sample, all']) {
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
  assert.equal(ran({}, { optInTags: ['sample'], excludeTags: ['best-practice'] }), false);
  assert.equal(
    scan({}, { optInTags: ['sample'], excludeTags: ['x'] }).engine.optInRules,
    undefined
  );
});

test('excludes still apply to rules optInRules unlocked', () => {
  assert.equal(ran({ optInRules: 'all', rules: { exclude: 'probe-sample-only' } }), false);
  assert.equal(ran({ optInRules: 'all' }, { excludeTags: ['sample'] }), false);
});

test('engine.optInRules names the unlocked tags only when the unlock added a rule', () => {
  const all = scan({ optInRules: 'all' }).engine.optInRules;
  assert.ok(all.includes('sample'), JSON.stringify(all));
  assert.ok(
    all.every((t) => RULE_TAGS.includes(t)),
    JSON.stringify(all)
  );
  assert.deepEqual(scan({ optInRules: ['SAMPLE'] }).engine.optInRules, ['sample']);
  // Nothing unlocked ran: a WCAG profile selects none of them.
  assert.equal(scan({ optInRules: 'all', profile: 'wcag22-aa' }).engine.optInRules, undefined);
  // The standard's profile, or naming the rule, runs it without the option, so
  // the option added nothing and the run still targets one standard.
  assert.equal(scan({ profile: 'sample-1.0' }).engine.optInRules, undefined);
  assert.equal(scan({ optInRules: 'all', profile: 'sample-1.0' }).engine.optInRules, undefined);
  assert.equal(
    scan({ optInRules: 'all', rules: { include: SAMPLE_ONLY.id } }).engine.optInRules,
    undefined
  );
  assert.equal(scan({}).engine.optInRules, undefined);
});

test('an unknown optInRules value is ignored with a warning naming the valid ones', () => {
  for (const optInRules of ['bitv', ['nope'], 42]) {
    const { value, warnings } = withWarnings(() => scan({ optInRules }));
    assert.equal(value.engine.optInRules, undefined, JSON.stringify(optInRules));
    assert.ok(!value.checksResults.some((r) => r.ruleId === SAMPLE_ONLY.id));
    assert.ok(
      warnings.some((w) =>
        /engineOptions\.optInRules: ignoring .*"all" or one of: .*\bsample\b/.test(w)
      ),
      warnings.join('\n')
    );
  }
  // A known tag next to an unknown one still applies.
  const { value, warnings } = withWarnings(() => scan({ optInRules: 'sample, bitv' }));
  assert.deepEqual(value.engine.optInRules, ['sample']);
  assert.ok(warnings.some((w) => w.includes('"bitv"')));
  // false and an empty list mean "not asked", with no warning.
  for (const optInRules of [false, null, '', []]) {
    const quiet = withWarnings(() => scan({ optInRules }));
    assert.equal(quiet.value.engine.optInRules, undefined);
    assert.ok(!quiet.warnings.some((w) => w.includes('optInRules')), JSON.stringify(optInRules));
  }
});

test("optInRules adds a standard's rollups to the run and the catalog, but none of its numbers without mappings", () => {
  const own = (r) => r.meta && r.meta.standard === 'Sample Standard';
  const plain = runa11yCoreOnHtml(HTML, { engineOptions: { optInRules: 'all' } });
  const rollups = plain.rulesResults.filter(own);
  assert.ok(rollups.length > 0);
  const sampleEntries = (r) =>
    r.meta.normativeMappings.filter((m) => m.standard === 'Sample Standard');
  assert.ok(plain.checksResults.every((r) => sampleEntries(r).length === 0));
  assert.equal(plain.engine.mappings, undefined);

  const mapped = runa11yCoreOnHtml(HTML, {
    engineOptions: { optInRules: 'all', mappings: ['sample'] }
  });
  assert.ok(mapped.checksResults.some((r) => sampleEntries(r).length > 0));

  const catalogRollups = (eo) => core.getRulesCatalog(eo).filter(own).length;
  assert.equal(catalogRollups({ optInRules: 'all' }), rollups.length);
  // As in the run, a WCAG profile's include leaves them out.
  assert.equal(catalogRollups({ optInRules: 'all', profile: 'wcag22-aa' }), 0);
  assert.equal(
    runa11yCoreOnHtml(HTML, {
      engineOptions: { optInRules: 'all', profile: 'wcag22-aa' }
    }).rulesResults.filter(own).length,
    0
  );
  assert.equal(catalogRollups({}), 0);
});
