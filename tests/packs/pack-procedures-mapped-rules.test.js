'use strict';

// A pack's standard maps core rules to its requirements (mappingsFor, as
// ruleMappedStandard or a mapping of its own writes it), and its procedures
// list them under the facets that assess what they check: a facet names the
// requirement ids of the mapping it assesses in mappedRequirements, or, the
// only facet of its requirement, assesses the requirement itself. They show
// in the facet's rules, and in its mappedRules, so a test that only core's
// rules check doesn't look unchecked.

const test = require('node:test');
const assert = require('node:assert/strict');

const { checkPack, definePack, ruleMappedStandard } = require('../../src/pack.js');
const { listProcedures, procedureChecklist, proceduresFor } = require('../../src/index.js');

const facet = (id, extra) => ({
  id,
  label: `Facet ${id}`,
  steps: ['Look at the page.'],
  passWhen: 'It is right.',
  failWhen: 'It is wrong, which fails {{requirement}}.',
  ...extra
});

// Requirement T-1 has two tests, T-1.1 and T-1.2, which its rule map links
// rules to, and a rule linked to T-1 as a whole; T-2 has one facet and is
// linked as it is.
function mappedPack(procedures) {
  const std = ruleMappedStandard({
    standard: 'Std M',
    tag: 'stdm',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: {
      '1.0': {
        'T-1': { title: 'Pages are named', wcagSc: [] },
        'T-1.1': { title: 'A page has a title', wcagSc: [] },
        'T-1.2': { title: 'A page has a language', wcagSc: [] },
        'T-2': { title: 'Links are named', wcagSc: [] }
      }
    },
    ruleMap: {
      '1.0': {
        'page-title-present': { requirements: ['T-1.1'] },
        'html-lang-attr-present': { requirements: ['T-1.2'] },
        'duplicate-id': { requirements: ['T-1'] },
        'link-name-present': { requirements: ['T-2'] }
      }
    }
  });
  return {
    name: 'stdm-pack',
    version: '1.0.0',
    namespace: 'stdm',
    core: '*',
    standard: {
      key: 'stdm',
      standard: 'Std M',
      versions: ['1.0'],
      ruleTag: 'stdm',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate,
      procedures: { '1.0': procedures }
    }
  };
}

const pack = definePack(
  mappedPack({
    'T-1': {
      title: 'Pages are named',
      facets: [
        facet('test-1-1', { mappedRequirements: ['T-1.1'], automation: 'full' }),
        facet('test-1-2', { mappedRequirements: ['T-1.2'] }),
        facet('test-1-3')
      ]
    },
    'T-2': { title: 'Links are named', facets: [facet('link-names')] }
  })
);

test("a facet lists the core rules the standard's mapping sends to what it assesses", () => {
  const r = proceduresFor('T-1', { packs: [pack], standard: 'stdm' });
  const byId = Object.fromEntries(r.facets.map((f) => [f.id, f]));
  assert.deepEqual(byId['test-1-1'].rules, ['page-title-present']);
  assert.deepEqual(byId['test-1-1'].mappedRules, ['page-title-present']);
  assert.deepEqual(byId['test-1-2'].rules, ['html-lang-attr-present']);
  // A facet that names nothing, in a requirement of several, lists none.
  assert.deepEqual(byId['test-1-3'].rules, []);
  assert.ok(!('mappedRules' in byId['test-1-3']));
  // The requirement lists them all, and the rule mapped to it as a whole.
  assert.deepEqual(r.rules, ['page-title-present', 'html-lang-attr-present', 'duplicate-id']);
  // automation stays what the facet says.
  assert.equal(byId['test-1-1'].automation, 'full');
  assert.equal(byId['test-1-2'].automation, 'manual');

  // The only facet of its requirement assesses the requirement itself.
  const t2 = proceduresFor('T-2', { packs: [pack], standard: 'stdm' });
  assert.deepEqual(t2.facets[0].rules, ['link-name-present']);
  assert.deepEqual(t2.facets[0].mappedRules, ['link-name-present']);
});

test('the pack’s own rules that claim a facet come first, and a rule is listed once', () => {
  const own = {
    id: 'stdm-title-check',
    meta: {
      title: 'Title check',
      description: 'Checks the title.',
      i18n: { titleKey: 'stdmTitleCheck_title', descriptionKey: 'stdmTitleCheck_description' },
      tags: ['stdm'],
      wcagSc: [],
      defaultSeverity: 'minor',
      type: 'automatic',
      defaultConfidence: 'high',
      coverage: { facetsBySc: {}, facetsByRequirement: { 'T-1': ['test-1-1'] } }
    },
    runInPage: () => ({ outcome: 'notApplicable', occurrences: [] })
  };
  const withRule = { ...pack, rules: [own] };
  const f = proceduresFor('T-1', { packs: [withRule], standard: 'stdm' }).facets[0];
  assert.deepEqual(f.rules, ['stdm-title-check', 'page-title-present']);
  assert.deepEqual(f.mappedRules, ['page-title-present']);
});

test('lists and checklists read them: the rules filter, and each item’s mappedRules', () => {
  const list = listProcedures({ packs: [pack], standard: 'stdm', rules: 'page-title-present' });
  assert.deepEqual(
    list.requirements.map((r) => [r.id, r.facets.map((f) => f.id)]),
    [['T-1', ['test-1-1']]]
  );
  const items = procedureChecklist({ packs: [pack], standard: 'stdm' }).items;
  const item = items.find((i) => i.facet === 'test-1-1');
  assert.deepEqual(item.rules, ['page-title-present']);
  assert.deepEqual(item.mappedRules, ['page-title-present']);
  assert.ok(!('mappedRules' in items.find((i) => i.facet === 'test-1-3')));
});

test('a standard whose mapping names none of its requirements lists only its own rules', () => {
  const throwing = {
    ...pack,
    standard: {
      ...pack.standard,
      mappingsFor: () => {
        throw new Error('no mapping');
      }
    }
  };
  const r = proceduresFor('T-2', { packs: [throwing], standard: 'stdm' });
  assert.deepEqual(r.facets[0].rules, []);
  assert.deepEqual(r.rules, []);
});

test('checkPack refuses mappedRequirements it can’t read', () => {
  const problems = (mappedRequirements) =>
    checkPack(
      mappedPack({
        'T-2': { title: 'Links', facets: [facet('link-names', { mappedRequirements })] }
      })
    ).join('\n');
  assert.equal(problems(['T-2']), '');
  for (const bad of ['T-2', [], [''], ['T-2', 'T-2'], [2]]) {
    assert.match(
      problems(bad),
      /mappedRequirements must list requirement ids/,
      JSON.stringify(bad)
    );
  }
});
