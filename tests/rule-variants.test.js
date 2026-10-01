'use strict';

/**
 * Rule variants (scripts/lib/rule-variants.js, docs/RULE_AUTHORING.md "Rule
 * variants"): a rule declared as another rule with different settings. What
 * the build refuses, and, through RGAA's contrast-minimum-rgaa, that a
 * variant runs its base's code with its own settings and messages.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveVariants } = require('../scripts/lib/rule-variants');
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
    [variant({ config: { ratio: '4.5' } }), /setting ratio must be a number/],
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

test("RGAA's contrast variant: its own bold threshold, its own messages", () => {
  // #888 on #fff is about 3.54:1. Bold 18.6px text is large for RGAA (from
  // 18.5px) and needs 3:1, but not for WCAG (from 14pt, about 18.67px).
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<p style="font-size:18.6px;font-weight:700;color:#888;background:#fff">Bold grey text</p>' +
    '<p style="font-size:16px;color:#aaa;background:#fff">Pale text</p></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const rule = (id) => result.checksResults.find((r) => r.ruleId === id);
  const wcag = rule('contrast-minimum').occurrences.map((o) => o.data.details.fontSizePx);
  const rgaa = rule('contrast-minimum-rgaa').occurrences;
  assert.equal(wcag.length, 2, 'WCAG fails both');
  assert.equal(rgaa.length, 1, 'RGAA fails only the pale text');
  assert.equal(rgaa[0].i18n.summaryKey, 'contrastMinimumRgaa_fail_belowThreshold');
});

// A rule's declared settings are its standard's: a result naming WCAG 1.4.3
// is decided at WCAG's thresholds whatever a caller passes, and a variant's
// at its own. Other caller config (excludeSelectors) still applies.
test("a caller's config cannot change a rule's declared settings", () => {
  // #767676 on #fff is about 4.54:1: passes 4.5:1, fails 7:1.
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<p id="grey" style="font-size:16px;color:#767676;background:#fff">Grey text</p>' +
    '</main></body></html>';
  const outcome = (ruleId, rules) =>
    runa11yCoreOnHtml(html, {
      engineOptions: { profile: 'rgaa-4.1.2', rules },
      runOnly: { includeRuleIds: [ruleId] }
    }).checksResults.find((r) => r.ruleId === ruleId).outcome;

  for (const ruleId of ['contrast-minimum', 'contrast-minimum-rgaa']) {
    assert.equal(outcome(ruleId, {}), 'pass', ruleId);
    assert.equal(outcome(ruleId, { [ruleId]: { normalTextRatio: 7 } }), 'pass', ruleId);
    assert.equal(
      outcome(ruleId, { [ruleId]: { normalTextRatio: 7, excludeSelectors: ['#grey'] } }),
      'notApplicable',
      `${ruleId}: excludeSelectors still applies`
    );
  }
});
