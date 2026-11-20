'use strict';

/**
 * A pack can build on other packs (pack.uses, experimental): its standard maps
 * their own rules as it maps core's, and its profiles run them. A scan runs
 * it only with those packs, at the version it was made with; without them it
 * is skipped, saying why. Without uses, a standard still can't map another
 * standard's own rules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  definePack,
  checkPack,
  describePacks,
  ruleMappedStandard,
  packScript
} = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');

const [MAJOR, MINOR] = require('../../package.json').version.split('.');
const TILDE = `~${MAJOR}.${MINOR}.0`;

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="a.png"></body></html>';

function standardPack({ name, ns, version = '1.0.0', rules = [], ruleMap, uses }) {
  const std = ruleMappedStandard({
    standard: ns.toUpperCase(),
    tag: ns,
    versions: [{ version: '1', wcagVersion: '2.2' }],
    requirements: { 1: { A: { title: 'Images', wcagSc: ['1.1.1'] } } },
    ruleMap: { 1: ruleMap }
  });
  const pack = {
    name,
    version,
    namespace: ns,
    core: TILDE,
    rules,
    ...(uses ? { uses } : {}),
    standard: {
      key: ns,
      standard: ns.toUpperCase(),
      versions: ['1'],
      ruleTag: ns,
      ruleMapped: true,
      profiles: { [`${ns}-1`]: { version: '1', tags: [ns], mappedRules: true } },
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  };
  return pack;
}

const ownRule = {
  id: 'aaa-images',
  meta: { title: 'Images', tags: ['aaa'], wcagSc: [] },
  runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] })
};
const both = { 'aaa-images': { requirements: ['A'] }, 'img-alt-present': { requirements: ['A'] } };

const aaa = (version = '1.0.0') =>
  definePack(standardPack({ name: '@x/aaa', ns: 'aaa', version, rules: [ownRule], ruleMap: both }));
const AAA = aaa();
const BBB = definePack(standardPack({ name: '@x/bbb', ns: 'bbb', uses: [AAA], ruleMap: both }));

const quiet = (fn) => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = warn;
  }
};
const scan = (packs, profile) =>
  quiet(() => runa11yCoreOnHtml(PAGE, { engineOptions: { packs, profile } }));

test("a pack's profile runs the own rules of a pack it uses, in Node and in a page", () => {
  const result = scan([AAA, BBB], 'bbb-1');
  assert.equal(result.skippedPacks, undefined);
  const ids = result.checksResults.map((c) => c.ruleId);
  assert.ok(ids.includes('aaa-images'), 'the used pack’s rule ran');
  assert.ok(ids.includes('img-alt-present'));
  const rollup = result.rulesResults.find((r) => r.ruleId === 'bbb-1-A');
  assert.equal(rollup.outcome, 'fail');
  assert.ok(rollup.data.details.contributors.some((c) => c.testId === 'aaa-images'));
  assert.deepEqual(result.engine.packs, ['@x/aaa@1.0.0', '@x/bbb@1.0.0']);
  // The used pack's own profile is as it was.
  const own = scan([AAA, BBB], 'aaa-1');
  assert.equal(own.rulesResults.find((r) => r.ruleId === 'aaa-1-A').outcome, 'fail');
  assert.ok(!own.rulesResults.some((r) => r.ruleId.startsWith('bbb-')));
});

test('a scan without a pack it uses, or with another version of it, skips it and says why', () => {
  const alone = scan([BBB], 'bbb-1');
  assert.deepEqual(alone.skippedPacks, [
    {
      name: '@x/bbb',
      reason: "it uses @x/aaa@1.0.0, which this scan doesn't have: pass it in the same packs"
    }
  ]);
  assert.ok(!alone.checksResults.some((c) => c.ruleId === 'aaa-images'));
  const other = scan([aaa('1.1.0'), BBB], 'bbb-1');
  assert.match(other.skippedPacks[0].reason, /it uses @x\/aaa@1\.0\.0/);
  // A page's script is prepared strictly: it refuses the set.
  assert.throws(() => packScript([BBB]), /@x\/bbb: it uses @x\/aaa@1\.0\.0/);
});

test('a chain of uses: one skipped for its missing pack takes the packs using it along', () => {
  const ccc = definePack(
    standardPack({
      name: '@x/ccc',
      ns: 'ccc',
      uses: [BBB],
      ruleMap: { 'aaa-images': { requirements: ['A'] } }
    })
  );
  const ok = scan([AAA, BBB, ccc], 'ccc-1');
  assert.equal(ok.skippedPacks, undefined);
  assert.ok(ok.checksResults.some((c) => c.ruleId === 'aaa-images'));
  const broken = scan([BBB, ccc], 'ccc-1');
  assert.deepEqual(broken.skippedPacks.map((s) => s.name).sort(), ['@x/bbb', '@x/ccc']);
  assert.deepEqual(describePacks([ccc])[0].uses, ['@x/bbb@1.0.0']);
});

test('uses must be valid packs, with no circle and one version of each', () => {
  const problems = (uses) =>
    checkPack(standardPack({ name: '@x/ddd', ns: 'ddd', uses, ruleMap: {} })).join('\n');
  assert.match(problems('aaa'), /uses must be a list/);
  assert.match(problems(['@x/aaa']), /uses\[0\] must be a pack/);
  assert.match(problems([{ name: '@x/zzz' }]), /uses\[0\] \(@x\/zzz\) is not valid/);
  const self = standardPack({ name: '@x/ddd', ns: 'ddd', ruleMap: {} });
  self.uses = [self];
  assert.match(checkPack(self).join('\n'), /goes round in a circle/);
  const a = standardPack({ name: '@x/eee', ns: 'eee', ruleMap: {} });
  const b = standardPack({ name: '@x/fff', ns: 'fff', uses: [a], ruleMap: {} });
  a.uses = [b];
  assert.match(checkPack(a).join('\n'), /goes round in a circle/);
  const g = definePack(
    standardPack({ name: '@x/ggg', ns: 'ggg', uses: [aaa('1.1.0')], ruleMap: {} })
  );
  assert.match(problems([AAA, g]), /reaches two versions of @x\/aaa: 1\.0\.0 and 1\.1\.0/);
  assert.deepEqual(problems([AAA]), '');
});

test('without uses, a standard still maps no other standard’s own rules', () => {
  assert.throws(
    () => definePack(standardPack({ name: '@x/hhh', ns: 'hhh', ruleMap: both })),
    /aaa-images: no such rule/
  );
});

test('describePacks lists the packs a pack uses, and the experimental API', () => {
  const [d] = describePacks([BBB]);
  assert.deepEqual(d.uses, ['@x/aaa@1.0.0']);
  assert.ok(d.experimental.some((e) => e.id === 'pack uses'));
  assert.equal(describePacks([AAA])[0].uses, undefined);
});
