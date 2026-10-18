'use strict';

/**
 * Rule variants (src/core/rule-variants.js, docs/RULE_AUTHORING.md "Rule
 * variants"): a rule declared as another rule with different settings. What
 * the build refuses, and that a caller cannot change a rule's settings. How a
 * variant runs is tested with the sample profile's
 * (tests/sample-profile/rule-variants.test.js).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveVariants } = require('../src/core/rule-variants');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');

const runInPage = () => ({ outcome: 'pass', occurrences: [] });
const BASE = {
  file: 'base.js',
  mod: {
    id: 'base',
    meta: { i18n: { titleKey: 'base_title' } },
    runInPage,
    settings: { ratio: 3, minPx: null }
  }
};
const variant = (over) => ({
  file: 'variant.js',
  mod: {
    id: 'variant',
    from: 'base',
    config: { ratio: 4.5 },
    meta: { i18n: { titleKey: 'variant_title' } },
    ...over
  }
});

test("a variant resolves to its base's code, with its own id, meta, settings and messages", () => {
  const { modules, problems } = resolveVariants([BASE, variant()]);
  assert.deepEqual(problems, []);
  const mod = modules[1].mod;
  assert.equal(mod.id, 'variant');
  assert.equal(mod.runInPage, runInPage);
  assert.deepEqual(mod.variant, {
    of: 'base',
    file: 'base.js',
    config: { ratio: 4.5 },
    messages: { from: 'base', to: 'variant' }
  });
});

test('the build refuses a variant it cannot resolve, saying why', () => {
  const cases = [
    [variant({ from: 'nope' }), /from names nope, which is no rule/],
    [variant({ config: { colour: 1 } }), /base has no setting colour \(it has: ratio, minPx\)/],
    [
      variant({ config: { ratio: '4.5' } }),
      /setting ratio must be a finite number above 0, not "4\.5"/
    ],
    [variant({ meta: { i18n: { titleKey: 'variantTitle' } } }), /titleKey must end in _title/]
  ];
  for (const [entry, message] of cases) {
    const { problems } = resolveVariants([BASE, entry]);
    assert.ok(
      problems.some((p) => message.test(p)),
      problems.join('; ')
    );
  }
  const noSettings = { file: 'b.js', mod: { ...BASE.mod, settings: undefined } };
  assert.match(resolveVariants([noSettings, variant()]).problems[0], /declares no settings/);
  const chained = { file: 'v2.js', mod: { ...variant().mod, id: 'v2', from: 'variant' } };
  assert.match(
    resolveVariants([BASE, variant(), chained]).problems[0],
    /variant is itself a variant; derive from its base/
  );
});

test('a numeric setting takes a finite number above 0, and one whose default is null that or null', () => {
  for (const [config, ok] of [
    [{ ratio: 7 }, true],
    [{ ratio: 0.5 }, true],
    [{ ratio: NaN }, false],
    [{ ratio: Infinity }, false],
    [{ ratio: -Infinity }, false],
    [{ ratio: 0 }, false],
    [{ ratio: -1 }, false],
    [{ ratio: null }, false],
    [{ minPx: 18.5 }, true],
    [{ minPx: null }, true],
    [{ minPx: NaN }, false],
    [{ minPx: 0 }, false],
    [{ minPx: -2 }, false],
    [{ minPx: '18px' }, false],
    [{ minPx: true }, false]
  ]) {
    const [name, value] = Object.entries(config)[0];
    const { problems } = resolveVariants([BASE, variant({ config })]);
    if (ok) assert.deepEqual(problems, [], `${name}: ${String(value)}`);
    else {
      assert.equal(problems.length, 1, `${name}: ${String(value)}`);
      assert.match(
        problems[0],
        new RegExp(
          `setting ${name} must be a finite number above 0${name === 'minPx' ? ', or null' : ''}, not `
        )
      );
    }
  }
});

// A rule's declared settings are its standard's: a result naming WCAG 1.4.3
// is decided at WCAG's thresholds whatever a caller passes. Other caller
// config (excludeSelectors) still applies. A variant's settings are tested
// with the sample profile's (tests/sample-profile/rule-variants.test.js).
test("a caller's config cannot change a rule's declared settings", () => {
  // #767676 on #fff is about 4.54:1: passes 4.5:1, fails 7:1.
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<p id="grey" style="font-size:16px;color:#767676;background:#fff">Grey text</p>' +
    '</main></body></html>';
  const outcome = (rules) =>
    runa11yCoreOnHtml(html, {
      engineOptions: { rules },
      runOnly: { includeRuleIds: ['contrast-minimum'] }
    }).checksResults.find((r) => r.ruleId === 'contrast-minimum').outcome;

  assert.equal(outcome({}), 'pass');
  assert.equal(outcome({ 'contrast-minimum': { normalTextRatio: 7 } }), 'pass');
  assert.equal(
    outcome({ 'contrast-minimum': { normalTextRatio: 7, excludeSelectors: ['#grey'] } }),
    'notApplicable',
    'excludeSelectors still applies'
  );
});

// Every setting a core rule offers a variant is described, so the catalog
// and docs/RULE_SETTINGS.md say what it changes and what it stands on.
test('every setting a core rule declares is described for the catalog', () => {
  const core = require('../src/core.js');
  const withSettings = core.getChecksCatalog().filter((r) => r.variantSettings);
  assert.ok(withSettings.some((r) => r.ruleId === 'contrast-minimum'));
  for (const r of withSettings) {
    for (const s of r.variantSettings) {
      assert.ok(s.description, `${r.ruleId}.${s.name} has a description`);
      assert.ok(s.basis, `${r.ruleId}.${s.name} says what it stands on`);
      if (s.values)
        assert.ok(
          s.values.includes(s.default),
          `${r.ruleId}.${s.name}'s default is one of its values`
        );
    }
  }
});

test('a setting with listed values takes only one of them', () => {
  const { settingsProblems } = require('../src/core/rule-variants.js');
  const settings = { mode: 'fail', ratio: 3 };
  const info = { mode: { values: ['fail', 'ask'] } };
  assert.deepEqual(settingsProblems('r', settings, { mode: 'ask', ratio: 4 }, info), []);
  assert.deepEqual(settingsProblems('r', settings, { mode: 'skip' }, info), [
    'setting mode must be one of "fail", "ask", not "skip"'
  ]);
  assert.deepEqual(settingsProblems('r', settings, { mode: 1 }, info), [
    'setting mode must be a string, not 1'
  ]);
});
