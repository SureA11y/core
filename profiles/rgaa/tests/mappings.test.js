'use strict';

/**
 * profiles/rgaa/mappings.js: how a rule's RGAA tests (the hand-written
 * table in profiles/rgaa/rule-map.js) become normativeMappings entries,
 * for rules and composites, and what the build rejects. The table rows used
 * here are added for the test and removed after, so these pin the mechanism
 * whatever the real table says.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { RGAA_RULE_TESTS } = require('../rule-map');
const { rgaaMappingsFor, validateRgaaRuleTests } = require('../mappings');
const { RGAA_TESTS } = require('../map');
const core = require('../../../src/core.js');

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

test("an entry belongs under the rule's criteria that RGAA relates to the test", () => {
  // 11.1 relates to 1.3.1, 2.4.6, 3.3.2 and 4.1.2; the rule maps to two of them.
  withRows({ 'probe-label': { tests: ['11.1.1'], note: 'n' } }, () => {
    const [e] = rgaaMappingsFor({ id: 'probe-label', wcagSc: ['4.1.2', '3.3.2', '2.5.3'] });
    assert.deepEqual(e.wcagSc, ['3.3.2', '4.1.2']);
  });
});

test("a rule with no WCAG mapping gets the whole criterion's WCAG list", () => {
  withRows({ 'probe-headings': { tests: ['9.1.2'], note: 'n' } }, () => {
    const [e] = rgaaMappingsFor({ id: 'probe-headings', wcagSc: [] });
    assert.equal(e.criterion, '9.1');
    assert.ok(e.wcagSc.length > 0);
  });
});

test('an unmapped rule gets nothing', () => {
  assert.deepEqual(rgaaMappingsFor({ id: 'probe-nothing', wcagSc: ['1.1.1'] }), []);
});

test("a composite carries its rules' tests that RGAA relates to its own criterion", () => {
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

test("validate: a test whose criterion RGAA relates to none of the rule's WCAG criteria is a problem", () => {
  withRows({ 'probe-img': { tests: ['3.2.1'], note: 'contrast is not alt text' } }, () => {
    const problems = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
    assert.equal(problems.length, 1);
    assert.match(problems[0], /test 3\.2\.1 belongs to criterion 3\.2/);
  });
});

test('validate: a row has only tests, note and outsideCorrespondence', () => {
  withRows({ 'probe-img': { tests: ['1.1.1'], note: 'n', review: { priority: 'low' } } }, () => {
    const problems = validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'));
    assert.deepEqual(problems, ['4.1.2 probe-img: unknown field review']);
  });
});

test("the real table is sound against the engine's rules", () => {
  const rules = core.getChecksCatalog().map((r) => ({ ruleId: r.ruleId, wcagSc: r.wcagSc }));
  assert.deepEqual(validateRgaaRuleTests(rules), []);
});

test('the image button, the title-only field and the labelled decorative image name their RGAA tests', () => {
  const { runa11yCoreOnHtml } = require('../../../tests/helpers/runDomRulesOnHtml.js');
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<input type="image" src="s.png" alt="" aria-label="Search">' +
    '<input type="text" title="Your email">' +
    '<img src="d.png" alt="" aria-label="line">' +
    '</main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { profile: 'rgaa-4.1.2' } });
  const rgaa = (ruleId) =>
    result.checksResults
      .find((r) => r.ruleId === ruleId)
      .meta.normativeMappings.filter((m) => m.standard === 'RGAA')
      .map((m) => m.requirement);
  assert.deepEqual(rgaa('input-image-alt-decorative'), ['1.3.3']);
  // The title-only field is form-control-programmatic-label-quality's since
  // label-title-only was deprecated (1.10.0); the profile no longer runs it.
  assert.deepEqual(rgaa('form-control-programmatic-label-quality'), ['11.1.3', '11.2.2']);
  assert.ok(!result.checksResults.some((r) => r.ruleId === 'label-title-only'));
  // presentation-role-conflict maps to no RGAA test, so the profile does not
  // run it; img-decorative-no-alternative reports the image under 1.2.1.
  assert.deepEqual(rgaa('img-decorative-no-alternative'), ['1.2.1']);
  assert.ok(!result.checksResults.some((r) => r.ruleId === 'presentation-role-conflict'));
});

// --- links outside RGAA's own WCAG correspondence ------------------------------

test('validate: a test outside the correspondence needs a reason, and a reason needs such a test', () => {
  const problems = (row) =>
    withRows({ 'probe-img': { note: 'n', ...row } }, () =>
      validateRgaaRuleTests(RULES).filter((p) => p.includes('probe-'))
    );
  // 3.2.1 (contrast) is related to other WCAG criteria than the rule's 1.1.1.
  assert.match(
    problems({ tests: ['3.2.1'] })[0],
    /link it only with a reason in outsideCorrespondence/
  );
  assert.deepEqual(problems({ tests: ['3.2.1'], outsideCorrespondence: { '3.2.1': 'why' } }), []);
  assert.ok(
    problems({ tests: ['3.2.1'], outsideCorrespondence: { '3.2.1': '  ' } }).some((p) =>
      p.includes('link it only with a reason')
    )
  );
  assert.ok(
    problems({ tests: ['1.1.1'], outsideCorrespondence: { '1.1.1': 'why' } }).some((p) =>
      p.includes('RGAA already relates to the rule')
    )
  );
  assert.ok(
    problems({ tests: ['1.1.1'], outsideCorrespondence: { '3.2.1': 'why' } }).some((p) =>
      p.includes('names 3.2.1, which is not linked')
    )
  );
});

test("an entry linked outside the correspondence goes under the rule's own criteria, for rules and rollups", () => {
  withRows(
    { 'probe-map': { tests: ['1.1.4'], note: 'n', outsideCorrespondence: { '1.1.4': 'why' } } },
    () => {
      const [own] = rgaaMappingsFor({ id: 'probe-map', wcagSc: ['2.1.1'] });
      assert.equal(own.requirement, '1.1.4');
      assert.deepEqual(own.wcagSc, ['2.1.1']);
      const rolled = rgaaMappingsFor({
        id: 'wcag-2.1.1-x',
        wcagSc: ['2.1.1'],
        checksIds: ['probe-map']
      });
      assert.deepEqual(
        rolled.map((e) => [e.requirement, e.wcagSc]),
        [['1.1.4', ['2.1.1']]]
      );
    }
  );
});

test('an exception on one rule does not carry over to another rule linked to the same test', () => {
  withRows(
    {
      'probe-map': { tests: ['1.1.4'], note: 'n', outsideCorrespondence: { '1.1.4': 'why' } },
      'probe-other': { tests: ['1.1.4'], note: 'n' }
    },
    () => {
      assert.deepEqual(rgaaMappingsFor({ id: 'probe-other', wcagSc: ['2.1.1'] }), []);
    }
  );
});
