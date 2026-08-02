'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { buildExplainGroups, computeGroupKey } = require('../../src/explain/group');
const { makeOccurrence, makeCheckResult, makeScanResult } = require('./fake-result');

test('buildExplainGroups: two structurally-identical occurrences dedupe into one group', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'main > ul > li:nth-child(1) > img' }),
      makeOccurrence({ selector: 'main > ul > li:nth-child(2) > img' })
    ]
  });
  const groups = buildExplainGroups(makeScanResult([check]));

  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].occurrences.length, 2, 'both occurrences roll into the one group');
});

test('buildExplainGroups: a different ruleId always produces a distinct group, even with identical selectors', () => {
  const checkA = makeCheckResult({
    ruleId: 'rule-a',
    occurrences: [makeOccurrence({ selector: 'div > span' })]
  });
  const checkB = makeCheckResult({
    ruleId: 'rule-b',
    occurrences: [makeOccurrence({ selector: 'div > span' })]
  });
  const groups = buildExplainGroups(makeScanResult([checkA, checkB]));

  assert.strictEqual(groups.length, 2);
});

test('buildExplainGroups: a distinct reasonCode in data.details.reasonCode splits the group', () => {
  const check = makeCheckResult({
    occurrences: [
      makeOccurrence({ selector: 'a > span', data: { details: { reasonCode: 'CODE_A' } } }),
      makeOccurrence({ selector: 'a > span', data: { details: { reasonCode: 'CODE_B' } } })
    ]
  });
  const groups = buildExplainGroups(makeScanResult([check]));

  assert.strictEqual(groups.length, 2);
});

test('buildExplainGroups: rules with no reasonCode at all still group correctly (falls back to a shared default)', () => {
  const check = makeCheckResult({
    occurrences: [makeOccurrence({ selector: 'img' }), makeOccurrence({ selector: 'img' })]
  });
  const groups = buildExplainGroups(makeScanResult([check]));

  assert.strictEqual(groups.length, 1);
});

test('buildExplainGroups: carries rule-level metadata (title/description/normativeMappings) onto the group', () => {
  const check = makeCheckResult({});
  const [group] = buildExplainGroups(makeScanResult([check]));

  assert.strictEqual(group.title, check.title);
  assert.strictEqual(group.description, check.description);
  assert.deepStrictEqual(group.normativeMappings, check.meta.normativeMappings);
});

test('buildExplainGroups: redactHtml omits html but keeps the structural selector', () => {
  const check = makeCheckResult({});
  const [group] = buildExplainGroups(makeScanResult([check]), { redactHtml: true });

  assert.strictEqual(group.html, undefined);
  assert.ok(group.selector);
});

test('buildExplainGroups: a check with outcome pass/notApplicable (empty occurrences) contributes no groups', () => {
  const check = makeCheckResult({ outcome: 'pass', occurrences: [] });
  const groups = buildExplainGroups(makeScanResult([check]));

  assert.strictEqual(groups.length, 0);
});

test('buildExplainGroups: does not mutate the input result at all', () => {
  const result = makeScanResult([makeCheckResult({})]);
  const before = JSON.stringify(result);
  buildExplainGroups(result);

  assert.strictEqual(JSON.stringify(result), before);
});

test('computeGroupKey: matches the shape documented in the design doc (ruleId|reasonCode|signature)', () => {
  const key = computeGroupKey(
    'nested-interactive-controls-absent',
    'NESTED_INTERACTIVE_CONTROL',
    'a > span[role="button"]'
  );
  assert.strictEqual(
    key,
    'nested-interactive-controls-absent|NESTED_INTERACTIVE_CONTROL|a>span[role="button"]'
  );
});
