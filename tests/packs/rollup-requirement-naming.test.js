'use strict';

// A standard whose rollups group several requirements (a criterion and its
// tests, say) writes its own rollups and can route a rule's findings in them
// (meta.contributions): an act may name the rollup's requirements a finding
// counts toward, and the rollup then names only the requirements of the
// findings that decided it, not every requirement of every deciding rule.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const STANDARD = 'Grouped Standard';
const TESTS = {
  'G.1.1': 'Regular text has enough contrast',
  'G.1.2': 'Large text has enough contrast',
  'G.1.3': 'Images have a text alternative'
};
// Which tests each rule checks, before any routing.
const RULE_TESTS = {
  'contrast-minimum': ['G.1.1', 'G.1.2'],
  'img-alt-present': ['G.1.3']
};
const entry = (requirement) => ({
  standard: STANDARD,
  version: '1.0',
  requirement,
  title: TESTS[requirement],
  wcagSc: []
});
const mappingsFor = ({ id, checksIds }) => {
  const ids = new Set((checksIds || [id]).flatMap((r) => RULE_TESTS[r] || []));
  return [...ids].sort().map(entry);
};

function packWith(contributions) {
  return definePack({
    name: 'grouped-pack',
    version: '1.0.0',
    namespace: 'grouped',
    core: '*',
    standard: {
      key: 'grouped',
      standard: STANDARD,
      versions: ['1.0'],
      profiles: { 'grouped-1.0': { version: '1.0', tags: ['grouped'], mappedRules: true } },
      ruleTag: 'grouped',
      ruleMapped: true,
      mappingsFor,
      composites: () => [
        {
          id: 'grouped-1.0-G.1',
          checksIds: ['contrast-minimum', 'img-alt-present'],
          meta: {
            ...(contributions ? { contributions } : {}),
            title: 'Group 1',
            description: '',
            wcagSc: [],
            level: null,
            standard: STANDARD,
            version: '1.0',
            criterion: 'G.1',
            tags: ['grouped'],
            standardMappings: Object.keys(TESTS).map(entry)
          }
        }
      ]
    }
  });
}

// Small text to G.1.1, large text to G.1.2.
const bySize = {
  'contrast-minimum': {
    default: 'count',
    findings: [
      { when: { 'typography.isLargeText': false }, act: { act: 'count', requirements: ['G.1.1'] } },
      { when: { 'typography.isLargeText': true }, act: { act: 'count', requirements: ['G.1.2'] } }
    ]
  }
};

const scan = (pack, body) =>
  runa11yCoreOnHtml(
    `<!doctype html><html lang="en"><head><title>t</title></head><body style="background:#fff">${body}</body></html>`,
    { engineOptions: { packs: [pack], profile: 'grouped-1.0' } }
  );
const rollupOf = (result) => result.rulesResults.find((r) => r.ruleId === 'grouped-1.0-G.1');
const named = (rollup) =>
  rollup.meta.normativeMappings
    .filter((m) => m.standard === STANDARD)
    .map((m) => m.requirement)
    .sort();
const contributor = (rollup, ruleId) =>
  rollup.data.details.contributors.find((c) => c.testId === ruleId);
const pale = (style, text) => `<p style="color:#aaa;${style}">${text}</p>`;

test('without routing, a failing rule names every requirement it checks', () => {
  const rollup = rollupOf(scan(packWith(null), pale('font-size:16px', 'Small text')));
  assert.equal(rollup.outcome, 'fail');
  assert.deepEqual(named(rollup), ['G.1.1', 'G.1.2']);
});

test('a routed finding names only the requirements its act gives', () => {
  const small = rollupOf(scan(packWith(bySize), pale('font-size:16px', 'Small text')));
  assert.equal(small.outcome, 'fail');
  assert.deepEqual(named(small), ['G.1.1']);
  assert.deepEqual(contributor(small, 'contrast-minimum').requirements, ['G.1.1']);

  const large = rollupOf(scan(packWith(bySize), pale('font-size:24px', 'Large text')));
  assert.deepEqual(named(large), ['G.1.2']);

  const both = rollupOf(
    scan(packWith(bySize), pale('font-size:16px', 'Small') + pale('font-size:24px', 'Large'))
  );
  assert.deepEqual(named(both), ['G.1.1', 'G.1.2']);
  assert.deepEqual(contributor(both, 'contrast-minimum').requirements, ['G.1.1', 'G.1.2']);
});

test('a question names the requirements of the findings it asks about', () => {
  const ask = {
    'contrast-minimum': {
      default: 'count',
      findings: [
        {
          when: { 'typography.isLargeText': true },
          act: { act: 'cantTell', requirements: ['G.1.2'] }
        },
        {
          when: { 'typography.isLargeText': false },
          act: { act: 'count', requirements: ['G.1.1'] }
        }
      ]
    }
  };
  const rollup = rollupOf(scan(packWith(ask), pale('font-size:24px', 'Large text')));
  assert.equal(rollup.outcome, 'cantTell');
  assert.deepEqual(named(rollup), ['G.1.2']);
  const c = contributor(rollup, 'contrast-minimum');
  assert.deepEqual([c.outcome, c.checkOutcome, c.requirements], ['cantTell', 'fail', ['G.1.2']]);
});

test('a rule whose findings all go elsewhere is not named by a rollup another rule decides', () => {
  const away = { 'contrast-minimum': { default: 'ignore' } };
  const rollup = rollupOf(
    scan(packWith(away), pale('font-size:16px', 'Small text') + '<img src="a.png">')
  );
  assert.equal(rollup.outcome, 'fail');
  assert.equal(contributor(rollup, 'contrast-minimum').outcome, 'pass');
  assert.equal(contributor(rollup, 'img-alt-present').outcome, 'fail');
  assert.deepEqual(named(rollup), ['G.1.3']);
});

test('a string act, as ruleMappedStandard writes, still names the rule as before', () => {
  const plain = { 'contrast-minimum': { default: 'count' } };
  const rollup = rollupOf(scan(packWith(plain), pale('font-size:16px', 'Small text')));
  assert.deepEqual(named(rollup), ['G.1.1', 'G.1.2']);
  assert.equal(contributor(rollup, 'contrast-minimum').requirements, undefined);
});

test('a contribution by reason code can name requirements too', () => {
  const byCode = {
    'contrast-minimum': {
      default: 'count',
      codes: { BELOW_THRESHOLD: { act: 'count', requirements: ['G.1.2'] } }
    }
  };
  const rollup = rollupOf(scan(packWith(byCode), pale('font-size:16px', 'Small text')));
  assert.equal(rollup.outcome, 'fail');
  assert.deepEqual(named(rollup), ['G.1.2']);
});

test('definePack refuses contributions it cannot use', () => {
  const problems = (contributions) => {
    try {
      packWith(contributions);
      return '';
    } catch (e) {
      return e.message;
    }
  };
  assert.equal(problems(bySize), '');
  assert.match(problems([]), /contributions must be an object/);
  assert.match(problems({ 'link-name-present': { default: 'count' } }), /not one of its checksIds/);
  assert.match(problems({ 'contrast-minimum': { default: 'fail' } }), /default must be/);
  assert.match(
    problems({ 'contrast-minimum': { default: { act: 'count', requirements: ['Z.9'] } } }),
    /names Z\.9, which the rollup does not/
  );
  assert.match(
    problems({ 'contrast-minimum': { default: 'count', codes: { X: 'maybe' } } }),
    /codes\.X must be/
  );
  assert.match(
    problems({ 'contrast-minimum': { default: 'count', findings: [{ when: {}, act: 'count' }] } }),
    /when must name at least one field/
  );
  assert.match(
    problems({ 'contrast-minimum': { default: { act: 'count', requirements: [] } } }),
    /requirements must name at least one/
  );
});
