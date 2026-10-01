'use strict';

/**
 * src/profile-kit.js: the mapping of a standard linked to rules requirement by
 * requirement, as a profile made with profile:new uses it.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { ruleMappedStandard } = require('../src/profile-kit');

const versions = [
  { version: '1.0', wcagVersion: '2.1' },
  { version: '2.0', wcagVersion: '2.2' }
];
const requirements = {
  '1.0': {
    '1.10': { title: 'Ten', wcagSc: ['1.1.1'] },
    1.2: { title: 'Two', wcagSc: [] }
  },
  '2.0': { 1.2: { title: 'Two again', wcagSc: ['2.5.8'] } }
};
const ruleMap = {
  '1.0': { a: { requirements: ['1.10', '1.2'] }, b: { requirements: ['1.2'] } },
  '2.0': { b: { requirements: ['1.2'] } }
};
const kit = ruleMappedStandard({ standard: 'Std', tag: 'std', versions, requirements, ruleMap });

test("a rule's entries are its requirements, oldest version first, in natural order", () => {
  assert.deepEqual(
    kit.mappingsFor({ id: 'b' }).map((m) => [m.version, m.requirement, m.title]),
    [
      ['1.0', '1.2', 'Two'],
      ['2.0', '1.2', 'Two again']
    ]
  );
  assert.deepEqual(
    kit.mappingsFor({ id: 'a' }).map((m) => m.requirement),
    ['1.2', '1.10']
  );
  assert.deepEqual(kit.mappingsFor({ id: 'a' })[1], {
    standard: 'Std',
    version: '1.0',
    requirement: '1.10',
    title: 'Ten',
    wcagSc: ['1.1.1']
  });
  assert.deepEqual(kit.mappingsFor({ id: 'unmapped' }), []);
});

test("a rollup's entries are the requirements of the rules it groups, once each", () => {
  assert.deepEqual(
    kit.mappingsFor({ checksIds: ['a', 'b'] }).map((m) => `${m.version} ${m.requirement}`),
    ['1.0 1.2', '1.0 1.10', '2.0 1.2']
  );
});

test('one rollup per requirement a rule checks, carrying the tag', () => {
  assert.deepEqual(
    kit.composites().map((c) => [c.id, c.checksIds, c.meta.tags, c.meta.criterion]),
    [
      ['std-1.0-1.2', ['a', 'b'], ['std'], '1.2'],
      ['std-1.0-1.10', ['a'], ['std'], '1.10'],
      ['std-2.0-1.2', ['b'], ['std'], '1.2']
    ]
  );
  const [first] = kit.composites();
  assert.equal(first.meta.standard, 'Std');
  assert.deepEqual(first.meta.standardMappings, kit.mappingsFor({ id: 'b' }).slice(0, 1));
});

test('sound tables have no problems', () => {
  assert.deepEqual(kit.validate([{ ruleId: 'a' }, { ruleId: 'b' }]), []);
});

test('the build checks name each problem', () => {
  const bad = ruleMappedStandard({
    standard: 'Std',
    tag: 'std',
    versions: [
      { version: '1.0', wcagVersion: '2.1' },
      { version: '2.0', wcagVersion: '3.0' },
      { version: '3.0', wcagVersion: '2.2' }
    ],
    requirements: {
      '1.0': { X: { title: 'X', wcagSc: ['2.5.8', '4.1.1'] } },
      '2.0': {}
    },
    ruleMap: {
      '1.0': {
        a: { requirements: ['X', 'X'] },
        gone: { requirements: ['X'] },
        c: { requirements: ['Y'] },
        d: { requirements: 'X' }
      },
      '9.0': {}
    }
  });
  assert.deepEqual(bad.validate([{ ruleId: 'a' }, { ruleId: 'c' }, { ruleId: 'd' }]), [
    '1.0 X: WCAG 2.1 has no criterion 2.5.8',
    'version 2.0: wcagVersion must be one of 2.0, 2.1, 2.2',
    'version 3.0 has no requirements table',
    '1.0 a: a requirement is listed twice',
    '1.0 gone: no such rule',
    '1.0 c: no requirement Y',
    '1.0 d: requirements must be a list',
    'the rule map names version 9.0, which versions does not list'
  ]);
});

test("a version's profile runs its WCAG version's A and AA rules", () => {
  assert.deepEqual(kit.wcagTagsOf('1.0'), ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  assert.equal(kit.wcagTagsOf('2.0').length, 6);
  assert.throws(() => kit.wcagTagsOf('3.0'), /Std has no version 3.0/);
});
