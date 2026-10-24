'use strict';

// A rule-mapped standard whose requirements restate WCAG criteria one for one
// can say so (ruleMappedStandard applicability 'wcag'): a requirement's rollup
// is then notApplicable only where WCAG's own would be, and cantTell
// (partialCoverage) where the rules don't see every case. Without it, a
// standard's rollups are its own to judge, as before.

const test = require('node:test');
const assert = require('node:assert/strict');

const { definePack, ruleMappedStandard } = require('../../src/pack.js');
const { runa11yCoreOnHtml } = require('../../src/testing.js');
const { coercedResult } = require('../../src/scan-result.js');

const requirements = {
  '1.0': {
    'R-1.2.2': { title: 'Captions', wcagSc: ['1.2.2'] },
    'R-2.4.4': { title: 'Link purpose', wcagSc: ['2.4.4'] }
  }
};
const ruleMap = {
  '1.0': {
    'video-caption': { requirements: ['R-1.2.2'] },
    'link-name-present': { requirements: ['R-2.4.4'] }
  }
};

function packFor(applicability) {
  const key = applicability ? 'restates' : 'own';
  const std = ruleMappedStandard({
    standard: `Std ${key}`,
    tag: key,
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements,
    ruleMap,
    ...(applicability ? { applicability } : {})
  });
  return definePack({
    name: `${key}-pack`,
    version: '1.0.0',
    namespace: key,
    core: '*',
    standard: {
      key,
      standard: `Std ${key}`,
      versions: ['1.0'],
      profiles: { [`${key}-1.0`]: { version: '1.0', tags: [key], mappedRules: true } },
      ruleTag: key,
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  });
}

const PAGE =
  '<!doctype html><html lang="en"><head><title>t</title></head><body><main><p>Text.</p></main></body></html>';
const outcomes = (pack, key) => {
  const r = runa11yCoreOnHtml(PAGE, { engineOptions: { packs: [pack], profile: `${key}-1.0` } });
  const get = (id) => r.rulesResults.find((x) => x.ruleId === `${key}-1.0-${id}`);
  return { r, get };
};

test("a standard that restates WCAG is notApplicable only where WCAG's rollup is", () => {
  const { r, get } = outcomes(packFor('wcag'), 'restates');
  assert.equal(get('R-1.2.2').outcome, 'cantTell');
  assert.equal(get('R-1.2.2').data.details.reasonCode, 'composite.rollup.cantTell.partialCoverage');
  assert.deepEqual(get('R-1.2.2').data.details.restatesWcag, ['1.2.2']);
  assert.equal(get('R-2.4.4').outcome, 'notApplicable');
  // Read back, the same.
  const read = coercedResult(JSON.parse(JSON.stringify(r)));
  const back = read.rulesResults.find((x) => x.ruleId === 'restates-1.0-R-1.2.2');
  assert.equal(back.outcome, 'cantTell');
});

test('without it, a standard judges its own requirements as before', () => {
  const { get } = outcomes(packFor(undefined), 'own');
  assert.equal(get('R-1.2.2').outcome, 'notApplicable');
  assert.equal(get('R-2.4.4').outcome, 'notApplicable');
});

test("applicability takes only 'wcag'", () => {
  assert.throws(
    () =>
      ruleMappedStandard({
        standard: 'X',
        tag: 'x',
        versions: [],
        requirements: {},
        ruleMap: {},
        applicability: 'all'
      }),
    TypeError
  );
});

test("a requirement its rules don't check in full is cantTell where they are all notApplicable", () => {
  const std = ruleMappedStandard({
    standard: 'Std partial',
    tag: 'partial',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: {
      '1.0': {
        'R-1.2.2': { ...requirements['1.0']['R-1.2.2'], partial: true },
        'R-2.4.4': { ...requirements['1.0']['R-2.4.4'], partial: true }
      }
    },
    ruleMap
  });
  const pack = definePack({
    name: 'partial-pack',
    version: '1.0.0',
    namespace: 'partial',
    core: '*',
    standard: {
      key: 'partial',
      standard: 'Std partial',
      versions: ['1.0'],
      profiles: { 'partial-1.0': { version: '1.0', tags: ['partial'], mappedRules: true } },
      ruleTag: 'partial',
      ruleMapped: true,
      mappingsFor: std.mappingsFor,
      composites: std.composites,
      validate: std.validate
    }
  });
  const { r, get } = outcomes(pack, 'partial');
  assert.equal(get('R-1.2.2').outcome, 'cantTell');
  assert.equal(get('R-1.2.2').data.details.reasonCode, 'composite.rollup.cantTell.partialCoverage');
  assert.equal(get('R-1.2.2').data.details.partial, true);
  assert.equal(get('R-2.4.4').outcome, 'cantTell');
  // Rules that all pass check only part of it too, as for a WCAG criterion.
  const linked = runa11yCoreOnHtml(PAGE.replace('<p>Text.</p>', '<a href="/x">Prices</a>'), {
    engineOptions: { packs: [pack], profile: 'partial-1.0' }
  });
  const passed = linked.rulesResults.find((x) => x.ruleId === 'partial-1.0-R-2.4.4');
  assert.equal(passed.outcome, 'cantTell');
  assert.equal(passed.data.details.reasonCode, 'composite.rollup.cantTell.partialCheck');
  const passedBack = coercedResult(JSON.parse(JSON.stringify(linked))).rulesResults.find(
    (x) => x.ruleId === 'partial-1.0-R-2.4.4'
  );
  assert.equal(passedBack.data.details.reasonCode, 'composite.rollup.cantTell.partialCheck');
  // Read back, the same.
  const read = coercedResult(JSON.parse(JSON.stringify(r)));
  const back = read.rulesResults.find((x) => x.ruleId === 'partial-1.0-R-1.2.2');
  assert.equal(back.outcome, 'cantTell');
});

test('partial takes only true or false', () => {
  const problems = ruleMappedStandard({
    standard: 'X',
    tag: 'x',
    versions: [{ version: '1.0', wcagVersion: '2.2' }],
    requirements: { '1.0': { A: { title: 'A', wcagSc: [], partial: 'yes' } } },
    ruleMap: {}
  }).validate([]);
  assert.deepEqual(problems, ['1.0 A: partial must be true or false']);
});
