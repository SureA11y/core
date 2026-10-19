'use strict';

// A rule-mapped standard can send a rule's findings by what they record
// (ruleMap findings, src/profile-kit.js): a finding goes to the requirements
// of the first entry whose `when` its data.details match, else by its reason
// code, else by the row. Here contrast failures are filed by text size and
// weight, which share one reason code.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const requirements = {
  '1.0': {
    'C.1': { title: 'Regular text', wcagSc: ['1.4.3'] },
    'C.2': { title: 'Bold text', wcagSc: ['1.4.3'] },
    'C.3': { title: 'Large regular text', wcagSc: ['1.4.3'] },
    'C.4': { title: 'Large bold text', wcagSc: ['1.4.3'] }
  }
};
const byType = (isLargeText, isBold) => ({
  'typography.isLargeText': isLargeText,
  'typography.isBold': isBold
});
const ruleMap = {
  '1.0': {
    'contrast-minimum': {
      requirements: ['C.1', 'C.2', 'C.3', 'C.4'],
      findings: [
        { when: byType(false, false), requirements: ['C.1'] },
        { when: byType(false, true), requirements: ['C.2'] },
        { when: byType(true, false), requirements: ['C.3'] },
        { when: byType(true, true), requirements: ['C.4'], outcome: 'cantTell' }
      ]
    }
  }
};
const std = ruleMappedStandard({
  standard: 'Fields Standard',
  tag: 'fields',
  versions: [{ version: '1.0', wcagVersion: '2.2' }],
  requirements,
  ruleMap
});
const pack = definePack({
  name: 'fields-pack',
  version: '1.0.0',
  namespace: 'fields',
  core: '*',
  standard: {
    key: 'fields',
    standard: 'Fields Standard',
    versions: ['1.0'],
    profiles: { 'fields-1.0': { version: '1.0', tags: ['fields'], mappedRules: true } },
    ruleTag: 'fields',
    ruleMapped: true,
    mappingsFor: std.mappingsFor,
    composites: std.composites,
    validate: std.validate
  }
});

const scan = (body) =>
  runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff">${body}</body></html>`,
    { engineOptions: { packs: [pack], profile: 'fields-1.0' } }
  );
const outcomes = (result) =>
  Object.fromEntries(
    ['C.1', 'C.2', 'C.3', 'C.4'].map((id) => [
      id,
      result.rulesResults.find((r) => r.ruleId === `fields-1.0-${id}`).outcome
    ])
  );
const pale = (style, text) => `<p style="color:#aaa;${style}">${text}</p>`;

test('each finding counts toward the requirement its fields match', () => {
  assert.deepEqual(outcomes(scan(pale('font-size:16px', 'Small text'))), {
    'C.1': 'fail',
    'C.2': 'pass',
    'C.3': 'pass',
    'C.4': 'pass'
  });
  assert.deepEqual(outcomes(scan(pale('font-size:24px', 'Large text'))), {
    'C.1': 'pass',
    'C.2': 'pass',
    'C.3': 'fail',
    'C.4': 'pass'
  });
  assert.deepEqual(outcomes(scan(pale('font-size:16px;font-weight:700', 'Bold text'))), {
    'C.1': 'pass',
    'C.2': 'fail',
    'C.3': 'pass',
    'C.4': 'pass'
  });
});

test("an entry's outcome makes a failing finding a question there", () => {
  const result = scan(pale('font-size:19px;font-weight:700', 'Large bold text'));
  const contrast = result.checksResults.find((c) => c.ruleId === 'contrast-minimum');
  assert.equal(contrast.outcome, 'fail');
  assert.equal(outcomes(result)['C.4'], 'cantTell');
  const c = result.rulesResults
    .find((r) => r.ruleId === 'fields-1.0-C.4')
    .data.details.contributors.find((x) => x.testId === 'contrast-minimum');
  assert.deepEqual([c.outcome, c.byReasonCode, c.checkOutcome], ['cantTell', true, 'fail']);
});

test('a finding no entry matches goes by the row', () => {
  const std2 = ruleMappedStandard({
    standard: 'X',
    tag: 'x',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements,
    ruleMap: {
      '1.0': {
        'contrast-minimum': {
          requirements: ['C.1'],
          findings: [{ when: { 'typography.fontSizePx': 99 }, requirements: ['C.2'] }]
        }
      }
    }
  });
  const c1 = std2.composites().find((c) => c.id === 'x-1.0-C.1');
  const c2 = std2.composites().find((c) => c.id === 'x-1.0-C.2');
  assert.deepEqual(c1.meta.contributions['contrast-minimum'].findings, [
    { when: { 'typography.fontSizePx': 99 }, act: 'ignore' }
  ]);
  assert.equal(c1.meta.contributions['contrast-minimum'].default, 'count');
  assert.equal(c2.meta.contributions['contrast-minimum'].findings[0].act, 'count');
  assert.equal(c2.meta.contributions['contrast-minimum'].default, 'ignore');
});

test('validate refuses a findings entry it cannot use', () => {
  const problems = (findings) =>
    ruleMappedStandard({
      standard: 'X',
      tag: 'x',
      versions: [{ version: '1.0', wcagVersion: '2.2' }],
      requirements,
      ruleMap: { '1.0': { 'contrast-minimum': { requirements: ['C.1'], findings } } }
    }).validate([{ ruleId: 'contrast-minimum', wcagSc: ['1.4.3'] }]);
  assert.deepEqual(problems([{ when: { reasonCode: 'BELOW_THRESHOLD' } }]), []);
  assert.match(problems({}).join('\n'), /findings must be a list/);
  assert.match(problems([{ when: {} }]).join('\n'), /when must name at least one field/);
  assert.match(problems([{ when: { a: [1] } }]).join('\n'), /when\.a must be/);
  assert.match(problems([{ when: { a: 1 }, requirements: ['Z'] }]).join('\n'), /no requirement Z/);
  assert.match(problems([{ when: { a: 1 }, outcome: 'fail' }]).join('\n'), /outcome can only be/);
});
