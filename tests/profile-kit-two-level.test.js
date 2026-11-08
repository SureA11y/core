'use strict';

/**
 * src/profile-kit.js with a second level: a standard that judges tests under
 * its requirements (RGAA's criteria and tests, BITV-Test's requirements and
 * steps), tests belonging to one requirement or several. Its results must be
 * those pack-rgaa's own functions give for the same tables: this file pins
 * the behaviour on a small standard, scanned too.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { ruleMappedStandard } = require('../src/profile-kit');
const { definePack, checkPack } = require('../src/pack.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const core = require('../src/core.js');

const versions = [{ version: '1', wcagVersion: '2.1' }];
const requirements = {
  1: {
    // Images: two tests.
    1.1: { title: 'Images have an alternative', wcagSc: ['1.1.1'], tests: ['1.1.1', '1.1.2'] },
    // Contrast, partial: its rules check only part of it.
    3.2: { title: 'Text contrast', wcagSc: ['1.4.3'], partial: true },
    // Names: a test shared with 1.1.
    4.1: { title: 'Controls have names', wcagSc: ['4.1.2'] }
  }
};
const tests = {
  1: {
    '1.1.1': { title: 'An <img> has alt', requirements: ['1.1'] },
    '1.1.2': { title: 'An image button has alt', requirements: ['1.1', '4.1'] },
    '3.2.1': { title: 'Regular text', requirements: ['3.2'] },
    '3.2.2': { title: 'Large text', requirements: ['3.2'] }
  }
};
const ruleMap = {
  1: {
    'img-alt-present': { requirements: ['1.1.1'], note: 'presence' },
    'input-image-alt-present': { requirements: ['1.1.2'] },
    'contrast-minimum': {
      requirements: ['3.2.1', '3.2.2'],
      findings: [
        { when: { 'typography.isLargeText': false }, requirements: ['3.2.1'] },
        { when: { 'typography.isLargeText': true }, requirements: ['3.2.2'] }
      ]
    },
    'img-alt-quality': { requirements: [], asks: ['1.1.1'] }
  }
};
const options = { standard: 'Two', tag: 'two', versions, requirements, tests, ruleMap };
const kit = ruleMappedStandard(options);
const RULES = core.getChecksCatalog().map((c) => ({ ruleId: c.ruleId, wcagSc: c.wcagSc || [] }));

const rollup = (id) => kit.composites().find((c) => c.id === `two-1-${id}`);

test('a rollup per requirement, grouping the rules of its tests', () => {
  assert.deepEqual(
    kit.composites().map((c) => [c.id, c.checksIds]),
    [
      ['two-1-1.1', ['img-alt-present', 'img-alt-quality', 'input-image-alt-present']],
      ['two-1-3.2', ['contrast-minimum']],
      ['two-1-4.1', ['input-image-alt-present']]
    ]
  );
  assert.equal(rollup('1.1').meta.criterion, '1.1');
  assert.equal(rollup('3.2').meta.partial, true);
  assert.equal('partial' in rollup('1.1').meta, false);
});

test("a rollup's entries are the tests its rules count toward, each under the requirement", () => {
  assert.deepEqual(
    rollup('1.1').meta.standardMappings.map((m) => [m.requirement, m.criterion, m.title, m.wcagSc]),
    [
      ['1.1.1', '1.1', 'An <img> has alt', ['1.1.1']],
      ['1.1.2', '1.1', 'An image button has alt', ['1.1.1']]
    ]
  );
  // A test of two requirements is in both rollups, under each.
  assert.deepEqual(
    rollup('4.1').meta.standardMappings.map((m) => [m.requirement, m.criterion, m.wcagSc]),
    [['1.1.2', '4.1', ['4.1.2']]]
  );
});

test('findings go to the test they fail, and an ask is a question there', () => {
  assert.deepEqual(rollup('3.2').meta.contributions['contrast-minimum'], {
    default: { act: 'count', requirements: ['3.2.1', '3.2.2'] },
    findings: [
      {
        when: { 'typography.isLargeText': false },
        act: { act: 'count', requirements: ['3.2.1'] }
      },
      { when: { 'typography.isLargeText': true }, act: { act: 'count', requirements: ['3.2.2'] } }
    ]
  });
  assert.deepEqual(rollup('1.1').meta.contributions['img-alt-quality'], {
    default: { act: 'cantTell', requirements: ['1.1.1'] }
  });
  // A rule judged whole has no contribution.
  assert.equal('img-alt-present' in rollup('1.1').meta.contributions, false);
});

test("a rule's entries name each test it counts toward", () => {
  assert.deepEqual(
    kit.mappingsFor({ id: 'input-image-alt-present' }).map((m) => [m.requirement, m.criterion]),
    [['1.1.2', '1.1']]
  );
});

test('with wcagCorrespondence, an entry names only the criteria it shares with the rule', () => {
  const strict = ruleMappedStandard({ ...options, wcagCorrespondence: true });
  // 1.1.2 is under 1.1 (1.1.1) first: a rule mapped to 4.1.2 shares none.
  assert.deepEqual(strict.mappingsFor({ id: 'input-image-alt-present', wcagSc: ['4.1.2'] }), []);
  assert.deepEqual(
    strict.mappingsFor({ id: 'img-alt-present', wcagSc: ['1.1.1'] }).map((m) => m.wcagSc),
    [['1.1.1']]
  );
  // Without it, every criterion of the test's requirement.
  assert.deepEqual(
    kit.mappingsFor({ id: 'img-alt-present', wcagSc: ['4.1.2'] }).map((m) => m.wcagSc),
    [['1.1.1']]
  );
});

test('the tables validate, and each mistake is named', () => {
  assert.deepEqual(kit.validate(RULES), []);
  const problems = (change) => {
    const t = JSON.parse(JSON.stringify({ requirements, tests, ruleMap }));
    change(t);
    return ruleMappedStandard({ ...options, ...t })
      .validate(RULES)
      .join('\n');
  };
  assert.match(
    problems((t) => (t.ruleMap[1]['img-alt-present'].requirements = ['9.9'])),
    /names 9\.9, no test or requirement/
  );
  assert.match(
    problems((t) => (t.tests[1]['1.1.1'].requirements = ['7.7'])),
    /test 1\.1\.1: no requirement 7\.7/
  );
  assert.match(
    problems((t) => (t.requirements[1]['1.1'].tests = ['1.1.1'])),
    /1\.1: tests must list the tests that name it \(1\.1\.1, 1\.1\.2\)/
  );
  assert.match(
    problems((t) => (t.ruleMap[1]['img-alt-quality'].asks = ['1.1.1', '1.1.1'])),
    /asks lists one twice/
  );
  assert.match(
    problems((t) => (t.ruleMap[1]['img-alt-present'].tests = [])),
    /unknown field tests/
  );
  const strict = (row) =>
    ruleMappedStandard({
      ...options,
      wcagCorrespondence: true,
      ruleMap: { 1: { 'img-alt-present': row } }
    })
      .validate(RULES)
      .join('\n');
  assert.match(
    strict({ requirements: ['3.2.1'] }),
    /3\.2\.1 corresponds to WCAG 1\.4\.3, none of the rule's \(1\.1\.1\)/
  );
  assert.equal(strict({ requirements: ['3.2.1'], outsideCorrespondence: { '3.2.1': 'why' } }), '');
  assert.match(
    ruleMappedStandard({
      ...options,
      tests: { 1: tests[1] },
      versions: [...versions, { version: '2', wcagVersion: '2.2' }],
      requirements: { ...requirements, 2: {} }
    })
      .validate(RULES)
      .join('\n'),
    /version 2 has no tests table/
  );
});

test('a scan with a two-level standard names the test each finding fails', () => {
  const pack = definePack({
    name: 'two-pack',
    version: '1.0.0',
    namespace: 'two',
    core: '*',
    standard: {
      key: 'two',
      standard: 'Two',
      versions: ['1'],
      profiles: {
        'two-1': { version: '1', tags: kit.wcagTagsOf('1').concat(['two']), mappedRules: true }
      },
      ruleTag: 'two',
      ruleMapped: true,
      mappingsFor: kit.mappingsFor,
      composites: kit.composites,
      validate: kit.validate
    }
  });
  assert.deepEqual(
    checkPack(pack).filter((p) => !/experimental/.test(p)),
    []
  );
  const html =
    '<!doctype html><html lang="en"><head><title>t</title></head><body><main>' +
    '<img src="a.png"><input type="image" src="b.png"></main></body></html>';
  const result = runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile: 'two-1' } });
  const images = result.rulesResults.find((r) => r.ruleId === 'two-1-1.1');
  assert.equal(images.outcome, 'fail');
  assert.deepEqual(
    images.meta.normativeMappings
      .filter((m) => m.standard === 'Two')
      .map((m) => [m.requirement, m.criterion]),
    [
      ['1.1.1', '1.1'],
      ['1.1.2', '1.1']
    ]
  );
  const names = result.rulesResults.find((r) => r.ruleId === 'two-1-4.1');
  assert.equal(names.outcome, 'fail');
});
