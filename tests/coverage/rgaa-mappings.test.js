'use strict';

/**
 * src/coverage/rgaa-mappings.js: how a rule's RGAA tests (the hand-written
 * table in src/coverage/rgaa-rule-map.js) become normativeMappings entries,
 * for rules and composites, and what the build rejects. The table rows used
 * here are added for the test and removed after, so these pin the mechanism
 * whatever the real table says.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { RGAA_RULE_TESTS } = require('../../src/coverage/rgaa-rule-map');
const { rgaaMappingsFor, validateRgaaRuleTests } = require('../../src/coverage/rgaa-mappings');
const { RGAA_TESTS } = require('../../src/coverage/rgaa-map');
const core = require('../../src/core.js');

const V = '4.1.2';

// Runs fn with extra rows in the 4.1.2 table, then restores it exactly.
function withRows(rows, fn) {
  const table = RGAA_RULE_TESTS[V];
  const saved = { ...table };
  Object.assign(table, rows);
  try {
    return fn();
  } finally {
    for (const k of Object.keys(table)) delete table[k];
    Object.assign(table, saved);
  }
}

test('a rule gets one entry per mapped test, in RGAA order, with its criterion', () => {
  withRows({ 'probe-img': { tests: ['1.1.3', '1.1.1'], note: 'n' } }, () => {
    const entries = rgaaMappingsFor({ id: 'probe-img', wcagSc: ['1.1.1'] });
    assert.deepEqual(
      entries.map((e) => e.requirement),
      ['1.1.1', '1.1.3']
    );
    assert.deepEqual(entries[0], {
      standard: 'RGAA',
      version: V,
      requirement: '1.1.1',
      title: RGAA_TESTS[V]['1.1.1'].title,
      criterion: '1.1',
      wcagSc: ['1.1.1']
    });
  });
});

test('an entry belongs under the rule\'s criteria that RGAA relates to the test', () => {
  // 11.1 relates to 1.3.1, 2.4.6, 3.3.2 and 4.1.2; the rule maps to two of them.
  withRows({ 'probe-label': { tests: ['11.1.1'], note: 'n' } }, () => {
    const [e] = rgaaMappingsFor({ id: 'probe-label', wcagSc: ['4.1.2', '3.3.2', '2.5.3'] });
    assert.deepEqual(e.wcagSc, ['3.3.2', '4.1.2']);
  });
});

test('a rule with no WCAG mapping gets the whole criterion\'s WCAG list', () => {
  withRows({ 'probe-headings': { tests: ['9.1.2'], note: 'n' } }, () => {
    const [e] = rgaaMappingsFor({ id: 'probe-headings', wcagSc: [] });
    assert.equal(e.criterion, '9.1');
    assert.ok(e.wcagSc.length > 0);
  });
});

test('an unmapped rule gets nothing', () => {
  assert.deepEqual(rgaaMappingsFor({ id: 'probe-nothing', wcagSc: ['1.1.1'] }), []);
});

test('a composite carries its rules\' tests that RGAA relates to its own criterion', () => {
  withRows(
    {
      'probe-a': { tests: ['1.1.1', '11.1.1'], note: 'n' },
      'probe-b': { tests: ['1.1.1', '1.2.1'], note: 'n' }
    },
    () => {
      const entries = rgaaMappingsFor({
        id: 'wcag-1.1.1-x',
        wcagSc: ['1.1.1'],
        checksIds: ['probe-a', 'probe-b']
      });
      // 11.1.1 relates to 1.3.1/2.4.6/3.3.2/4.1.2, not 1.1.1; 1.1.1 appears once.
      assert.deepEqual(
        entries.map((e) => e.requirement),
        ['1.1.1', '1.2.1']
      );
      assert.ok(entries.every((e) => e.wcagSc.length === 1 && e.wcagSc[0] === '1.1.1'));
    }
  );
});

// --- what the build rejects ----------------------------------------------------

const RULES = [
  { ruleId: 'probe-img', wcagSc: ['1.1.1'] },
  { ruleId: 'probe-bp', wcagSc: [] }
];

test('validate: a sound table has no problems', () => {
  withRows(
    {
      'probe-img': { tests: ['1.1.1'], note: 'presence' },
      'probe-bp': { tests: ['9.1.2'], note: 'best practice RGAA tests' }
    },
    () => {
      const mine = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
      assert.deepEqual(mine, []);
    }
  );
});

test('validate: unknown rule, unknown test, duplicate and missing note are problems', () => {
  withRows(
    {
      'probe-missing-rule': { tests: ['1.1.1'], note: 'n' },
      'probe-img': { tests: ['1.1.1', '1.1.1', '99.9.9'], note: '' }
    },
    () => {
      const problems = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
      assert.ok(problems.some((p) => p.includes('probe-missing-rule: no such rule')));
      assert.ok(problems.some((p) => p.includes('probe-img: needs')));
    }
  );
  withRows({ 'probe-img': { tests: ['1.1.1', '1.1.1', '99.9.9'], note: 'n' } }, () => {
    const problems = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
    assert.ok(problems.some((p) => p.includes('lists a test twice')));
    assert.ok(problems.some((p) => p.includes('no such test 99.9.9')));
  });
});

test('validate: a test whose criterion RGAA relates to none of the rule\'s WCAG criteria is a problem', () => {
  withRows({ 'probe-img': { tests: ['3.2.1'], note: 'contrast is not alt text' } }, () => {
    const problems = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /test 3\.2\.1 belongs to criterion 3\.2/);
  });
});

test('the real table is sound against the engine\'s rules', () => {
  const rules = core.getChecksCatalog().map((r) => ({ ruleId: r.ruleId, wcagSc: r.wcagSc }));
  assert.deepEqual(validateRgaaRuleTests(rules), []);
});
