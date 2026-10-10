'use strict';

/**
 * Custom rules in the WCAG rollups (#179). A rollup's rules were a fixed
 * list of built-in ids, so a custom rule mapped to a criterion was in no
 * rollup: a failing one left the criterion's rollup as the built-ins had it.
 * A custom rule that ran now counts toward the rollup of each criterion it
 * maps to, as a built-in does; an override counts where its own mapping
 * says; and the rollup names its custom rules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { runa11yCoreOnHtml } = require('./helpers/runa11yCoreOnHtml');
const core = require('../src/index.js');
const { renderHtmlReport } = require('../src/report.js');

// No non-text content: every built-in rule of 1.1.1 is notApplicable.
const PLAIN =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text</p></main></body></html>';
const IMAGES =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png" alt="A chart"></main></body></html>';

const R111 = 'wcag-1.1.1-non-text-content';
const R131 = 'wcag-1.3.1-info-and-relationships';

const rule = (id, meta, outcome = 'fail') => ({
  id,
  meta: { title: id, description: id, ...meta },
  runInPage: `function (ctx) { return { ruleId: ctx.rule.ruleId, outcome: '${outcome}', occurrences: [] }; }`
});

function scan(html, customRules, runOnly) {
  const { warn } = console;
  const warned = [];
  console.warn = (m) => warned.push(String(m));
  try {
    const result = runa11yCoreOnHtml(html, {
      engineOptions: { customRules },
      runOnly,
      entryPointParity: false
    });
    return { result, warned };
  } finally {
    console.warn = warn;
  }
}
const rollup = (result, id) => result.rulesResults.find((r) => r.ruleId === id);
const check = (result, id) => result.checksResults.find((r) => r.ruleId === id);

test('the rollups this test reads exist', () => {
  const { result } = scan(PLAIN, []);
  assert.ok(rollup(result, R111));
  assert.ok(rollup(result, R131));
  assert.equal(rollup(result, R111).outcome, 'notApplicable');
});

test('a custom rule counts toward the rollup of the criterion it maps to', async (t) => {
  for (const [outcome, expected] of [
    ['fail', 'fail'],
    ['cantTell', 'cantTell'],
    ['pass', 'pass'],
    ['notApplicable', 'notApplicable']
  ]) {
    await t.test(`a ${outcome} makes the rollup ${expected}`, () => {
      const { result } = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] }, outcome)]);
      const r = rollup(result, R111);
      assert.equal(r.outcome, expected);
      assert.ok(r.data.details.checksIds.includes('acme-alt'));
      assert.deepEqual(r.data.details.customChecksIds, ['acme-alt']);
      const c = r.data.details.contributors.find((x) => x.testId === 'acme-alt');
      assert.equal(c.custom, true);
      assert.equal(c.outcome, outcome);
      assert.deepEqual(check(result, 'acme-alt').rollupIds, [R111]);
    });
  }
});

test('a failing custom rule fails a rollup the built-ins pass', () => {
  const before = scan(IMAGES, []).result;
  assert.notEqual(rollup(before, R111).outcome, 'fail');
  const { result } = scan(IMAGES, [rule('acme-alt', { wcagSc: ['1.1.1'] })]);
  assert.equal(rollup(result, R111).outcome, 'fail');
  assert.equal(rollup(result, R111).data.details.metrics.failCount, 1);
});

test('a mapping in normativeMappings counts as meta.wcagSc does', () => {
  const { result } = scan(PLAIN, [
    rule('acme-alt', { normativeMappings: [{ standard: 'WCAG', requirement: '1.1.1' }] })
  ]);
  assert.equal(rollup(result, R111).outcome, 'fail');
  assert.deepEqual(rollup(result, R111).data.details.customChecksIds, ['acme-alt']);
});

test("meta.wcagSc is a custom rule's WCAG mapping (it was dropped)", () => {
  const { result } = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })]);
  assert.deepEqual(
    check(result, 'acme-alt').meta.normativeMappings.filter((m) => m.standard === 'WCAG'),
    // As a built-in rule states it.
    [
      {
        standard: 'WCAG',
        version: '2.2',
        requirement: '1.1.1',
        title: 'Non-text Content',
        conformanceLevel: 'A',
        url: 'https://www.w3.org/TR/WCAG22/#non-text-content',
        understandingUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html'
      }
    ]
  );
  // Selected by a WCAG target through it, as a built-in rule is.
  const target = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })], {
    wcag: { version: '2.2', level: 'A' }
  }).result;
  assert.ok(check(target, 'acme-alt'));
  assert.equal(rollup(target, R111).outcome, 'fail');
});

test('a rule mapped to two criteria counts toward both rollups', () => {
  const { result } = scan(PLAIN, [rule('acme-two', { wcagSc: ['1.1.1', '1.3.1'] })]);
  assert.equal(rollup(result, R111).outcome, 'fail');
  assert.equal(rollup(result, R131).outcome, 'fail');
  assert.deepEqual(check(result, 'acme-two').rollupIds.sort(), [R111, R131].sort());
});

test('a custom rule mapped to no criterion is in no rollup', () => {
  const { result } = scan(PLAIN, [rule('acme-bp', { tags: ['best-practice'] })]);
  assert.deepEqual(check(result, 'acme-bp').rollupIds, []);
  assert.equal(rollup(result, R111).outcome, 'notApplicable');
  assert.equal(rollup(result, R111).data.details.customChecksIds, undefined);
});

test("a custom rule the selection leaves out doesn't count", () => {
  const { result } = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })], {
    tags: ['wcag2a']
  });
  assert.equal(check(result, 'acme-alt'), undefined);
  const r = rollup(result, R111);
  assert.equal(r.outcome, 'notApplicable');
  assert.ok(!r.data.details.checksIds.includes('acme-alt'));
});

test('naming a rollup selects the custom rules mapped to its criteria', () => {
  const { result } = scan(
    PLAIN,
    [rule('acme-alt', { wcagSc: ['1.1.1'] }), rule('acme-other', { wcagSc: ['1.3.1'] })],
    [R111]
  );
  assert.ok(check(result, 'acme-alt'));
  assert.equal(check(result, 'acme-other'), undefined);
  assert.equal(rollup(result, R111).outcome, 'fail');
  // And excluding it leaves them out.
  const excluded = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })], {
    excludeRuleIds: [R111]
  }).result;
  assert.equal(check(excluded, 'acme-alt'), undefined);
});

test('an override counts where its own mapping says', async (t) => {
  const listed = rollup(scan(PLAIN, []).result, R111).data.details.checksIds;
  const at = listed.indexOf('img-alt-present');
  assert.ok(at >= 0);

  await t.test('mapped to the criterion, it keeps its place', () => {
    const { result, warned } = scan(PLAIN, [
      rule('img-alt-present', { wcagSc: ['1.1.1'] }, 'cantTell')
    ]);
    const r = rollup(result, R111);
    assert.equal(r.data.details.checksIds.indexOf('img-alt-present'), at);
    assert.deepEqual(r.data.details.customChecksIds, ['img-alt-present']);
    assert.equal(r.outcome, 'cantTell');
    assert.ok(!warned.some((w) => /no longer counts/.test(w)));
  });

  await t.test('mapped to none, it leaves the rollup, and is said so', () => {
    const { result, warned } = scan(IMAGES, [rule('img-alt-present', {}, 'fail')]);
    const r = rollup(result, R111);
    assert.ok(!r.data.details.checksIds.includes('img-alt-present'));
    assert.notEqual(r.outcome, 'fail');
    assert.deepEqual(check(result, 'img-alt-present').rollupIds, []);
    assert.ok(
      warned.some(
        (w) => w.includes('"img-alt-present"') && w.includes(R111) && /no longer counts/.test(w)
      ),
      warned.join('\n')
    );
  });
});

test("a standard's own rollups keep their lists", () => {
  const { result } = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })]);
  for (const r of result.rulesResults.filter((x) => x.meta && x.meta.standard)) {
    assert.ok(!r.data.details.checksIds.includes('acme-alt'), r.ruleId);
  }
});

test('the catalog lists the custom rules of each rollup', () => {
  const engineOptions = { customRules: [rule('acme-alt', { wcagSc: ['1.1.1'] })] };
  const fromList = core.getRulesCatalog(engineOptions).find((r) => r.id === R111);
  const byId = core.getCompositeRuleById(R111, engineOptions);
  for (const entry of [fromList, byId]) {
    assert.ok(entry.checksIds.includes('acme-alt'));
    assert.deepEqual(entry.customChecksIds, ['acme-alt']);
  }
  assert.ok(!core.getCompositeRuleById(R111).checksIds.includes('acme-alt'));
  assert.ok(core.getChecksForRunOnly([R111], engineOptions).some((c) => c.ruleId === 'acme-alt'));
});

test("the HTML report's WCAG table shows the custom rule in the rollup", () => {
  const { result } = scan(PLAIN, [rule('acme-alt', { wcagSc: ['1.1.1'] })]);
  const html = renderHtmlReport(result);
  const row = html.split('<tr').find((r) => r.includes('1.1.1') && r.includes('acme-alt'));
  assert.ok(row, 'a 1.1.1 row naming acme-alt');
});
