'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const { assertRule } = require('./helpers/assertRule');

/**
 * These checks lock down runOnly behavior for both:
 * - legacy shape: { type:'tag', values:[...] }
 * - modern shape: { tags/includeRuleIds/excludeRuleIds }
 *
 * They assume your helper accepts an options object:
 *   runa11yCoreOnHtml(html, { runOnly, engineOptions, contextSelector, excludeSelectors })
 */

test('runOnly: legacy tag filter includes only matching-tag checks', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  // img-alt-attr-present is tagged wcag2a
  const result = runa11yCoreOnHtml(html, { runOnly: { type: 'tag', values: ['wcag2a'] } });

  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });

  // best-practice rule should not run when filtering to wcag2a
  const noopener = result.checksResults.find((r) => r.ruleId === 'links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: modern tags filter includes only matching-tag checks', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, { runOnly: { tags: ['wcag2a'] } });

  assertRule(result, 'img-alt-present', 'fail', { minOccurrences: 1 });

  const noopener = result.checksResults.find((r) => r.ruleId === 'links-target-blank-noopener');
  assert.ok(!noopener, 'best-practice rule should not be present when filtering to wcag2a');
});

test('runOnly: includeRuleIds allows selecting a single rule', () => {
  // Use a clearly normative automatic rule here to avoid coupling filtering behavior
  // to advisory / best-practice semantics.
  const html = `<!doctype html><html><body><input type="text"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['form-control-programmatic-label-present'] }
  });

  // Only the included rule should run
  assertRule(result, 'form-control-programmatic-label-present', 'fail', { minOccurrences: 1 });

  const anyOther = result.checksResults.find(
    (r) => r.ruleId !== 'form-control-programmatic-label-present'
  );
  assert.ok(!anyOther, 'no other checks should be present when includeRuleIds is set');
});

test('runOnly: excludeRuleIds blocks a rule even if tags match', () => {
  const html = `<!doctype html><html><body><img src="x.png"></body></html>`;

  const result = runa11yCoreOnHtml(html, {
    runOnly: {
      tags: ['wcag2a'],
      excludeRuleIds: ['img-alt-present']
    }
  });

  const blocked = result.checksResults.find((r) => r.ruleId === 'img-alt-present');
  assert.ok(!blocked, 'excluded rule should not be present');
});

test('runOnly: include/exclude accept ids with and without ENGINE_TAG prefix', () => {
  const html = `<!doctype html><html><body><input type="text"></body></html>`;

  // Your engine supports matching with/without the '' prefix.
  const result = runa11yCoreOnHtml(html, {
    runOnly: { includeRuleIds: ['form-control-programmatic-label-present'] }
  });

  assertRule(result, 'form-control-programmatic-label-present', 'fail', { minOccurrences: 1 });
});

// ENGINE_OPTIONS.md states the runOnly fields mirror their engineOptions
// counterparts, and those have always taken a comma-separated string.
const FILTER_PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="x.png"><button></button></body></html>';

function ranRuleIds(runOnly) {
  return runa11yCoreOnHtml(FILTER_PAGE, { runOnly }).checksResults.map((r) => r.ruleId);
}

const ALL_RULE_COUNT = ranRuleIds(null).length;

test('runOnly: includeRuleIds accepts a comma-separated string, not only an array', () => {
  assert.deepStrictEqual(ranRuleIds({ includeRuleIds: 'img-alt-present' }), ['img-alt-present']);
  assert.deepStrictEqual(
    ranRuleIds({ includeRuleIds: 'img-alt-present, button-name-present' }).sort(),
    ['button-name-present', 'img-alt-present']
  );
});

test('runOnly: excludeRuleIds and tags accept a string too', () => {
  assert.strictEqual(ranRuleIds({ excludeRuleIds: 'img-alt-present' }).length, ALL_RULE_COUNT - 1);
  assert.ok(ranRuleIds({ tags: 'wcag111' }).length < ALL_RULE_COUNT);
});

test('runOnly: an empty or unusable filter value still means no filter', () => {
  for (const runOnly of [
    { includeRuleIds: '' },
    { includeRuleIds: '  ,  ' },
    { includeRuleIds: 42 }
  ]) {
    assert.strictEqual(ranRuleIds(runOnly).length, ALL_RULE_COUNT);
  }
});

test('runOnly: a bare array of rule ids selects those rules, as in axe-core', () => {
  assert.deepStrictEqual(ranRuleIds(['img-alt-present']), ['img-alt-present']);
  assert.deepStrictEqual(ranRuleIds('img-alt-present'), ['img-alt-present']);
  assert.deepStrictEqual(ranRuleIds(['img-alt-present', 'button-name-present']).sort(), [
    'button-name-present',
    'img-alt-present'
  ]);
  // A composite id brings in its atomic rules, as includeRuleIds does.
  assert.deepStrictEqual(ranRuleIds(['wcag-4.1.1-parsing']), ['duplicate-id']);
});

test('runOnly: a bare array of tags selects by tag, the same as { tags }', () => {
  assert.deepStrictEqual(
    ranRuleIds(['wcag2a', 'best-practice']).sort(),
    ranRuleIds({ tags: ['wcag2a', 'best-practice'] }).sort()
  );
  assert.deepStrictEqual(ranRuleIds(['WCAG2A']).sort(), ranRuleIds({ tags: ['wcag2a'] }).sort());
});

test('runOnly: a bare array mixing rule ids and tags, or naming neither, throws', () => {
  assert.throws(() => ranRuleIds(['img-alt-present', 'wcag2a']), /either rule ids or tags/);
  assert.throws(() => ranRuleIds(['img-alt-presnt']), /no rule or tag named "img-alt-presnt"/);
});

test('runOnly: an object-form include list that names nothing throws, so a typo cannot run no rule', (t) => {
  t.mock.method(console, 'warn', () => {});
  const invalid = (fn, re) =>
    assert.throws(fn, (e) => e.code === 'INVALID_RUN_ONLY' && re.test(e.message));
  invalid(() => ranRuleIds({ tags: ['nonsense'] }), /runOnly\.tags: no tag named "nonsense"/);
  invalid(() => ranRuleIds({ includeRuleIds: ['nope'] }), /runOnly\.includeRuleIds: no rule/);
  invalid(() => ranRuleIds({ type: 'tag', values: ['nonsense'] }), /runOnly\.tags/);
  invalid(
    () => runa11yCoreOnHtml(FILTER_PAGE, { engineOptions: { rules: { include: 'typo' } } }),
    /engineOptions\.rules\.include: no rule named "typo"/
  );
  invalid(
    () => runa11yCoreOnHtml(FILTER_PAGE, { engineOptions: { tags: { include: ['wcag2.2aa'] } } }),
    /engineOptions\.tags\.include: no tag named "wcag2\.2aa"/
  );
  // The bare-array form carries the same code.
  invalid(() => ranRuleIds(['img-alt-presnt']), /no rule or tag named/);
});

test('runOnly: an unknown name beside known ones, or in an exclude list, is warned about and ignored', (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  assert.deepStrictEqual(ranRuleIds({ includeRuleIds: ['nope', 'img-alt-present'] }), [
    'img-alt-present'
  ]);
  assert.deepStrictEqual(
    ranRuleIds({ tags: ['wcag2a'], excludeTags: ['zzz'] }).sort(),
    ranRuleIds({ tags: ['wcag2a'] }).sort()
  );
  const warnings = warn.mock.calls.map((c) => c.arguments.join(' '));
  assert.ok(warnings.some((w) => /runOnly\.includeRuleIds: no rule named "nope"; ignored/.test(w)));
  assert.ok(warnings.some((w) => /runOnly\.excludeTags: no tag named "zzz"; ignored/.test(w)));
});

test('runOnly: an empty array still means every rule', () => {
  assert.strictEqual(ranRuleIds([]).length, ALL_RULE_COUNT);
});

test('runOnly: a custom rule id in a bare array selects that rule', () => {
  const customRules = [
    {
      id: 'acme-has-main',
      meta: { title: 'Has main', description: 'A main element exists', tags: ['acme'] },
      runInPage: (ctx) => ({
        ruleId: ctx.rule.ruleId,
        outcome: ctx.document.querySelector('main') ? 'pass' : 'fail',
        severity: 'minor',
        occurrences: []
      })
    }
  ];
  const run = (runOnly) =>
    runa11yCoreOnHtml(FILTER_PAGE, { runOnly, engineOptions: { customRules } }).checksResults.map(
      (r) => r.ruleId
    );
  assert.deepStrictEqual(run(['acme-has-main']), ['acme-has-main']);
  assert.deepStrictEqual(run(['acme']), ['acme-has-main']);
});
