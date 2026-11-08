'use strict';

/**
 * A standard as data (src/standard-data.js, src/schemas/standard.schema.json):
 * checkStandardData and the schema accept the same data and refuse the same
 * mistakes; standardFromData gives the entry ruleMappedStandard gives for the
 * same tables; and the sample standard, built from data, scans as the sample
 * pack does.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Ajv = require('ajv');

const { checkStandardData, standardFromData, standardDataOf } = require('../src/standard-data.js');
const { ruleMappedStandard } = require('../src/profile-kit.js');
const { definePack } = require('../src/pack.js');
const { runa11yCoreOnHtml } = require('./helpers/runDomRulesOnHtml.js');
const samplePack = require('./fixtures/packs/sample.js');

const schema = require('../src/schemas/standard.schema.json');
const validateSchema = new Ajv({ allErrors: true }).compile(schema);

const SAMPLE = path.join(__dirname, 'fixtures', 'profiles', 'sample');
const { VERSIONS, REQUIREMENTS } = require(path.join(SAMPLE, 'requirements'));
const { RULE_REQUIREMENTS } = require(path.join(SAMPLE, 'rule-map'));

// The sample standard's tables as data, and its pack's profiles.
const sampleData = {
  format: 'surea11y-standard/1',
  key: 'sample',
  standard: 'Sample Standard',
  versions: VERSIONS.map(({ version, wcagVersion }) => ({ version, wcagVersion })),
  data: Object.fromEntries(
    VERSIONS.map(({ version }) => [
      version,
      { requirements: REQUIREMENTS[version], ruleMap: RULE_REQUIREMENTS[version] || {} }
    ])
  ),
  profiles: JSON.parse(JSON.stringify(samplePack.standard.profiles))
};

// A two-level standard: requirements with tests, groups.
const twoLevel = {
  format: 'surea11y-standard/1',
  key: 'two',
  standard: 'Two',
  lang: 'en',
  versions: [{ version: '1', wcagVersion: '2.1', basedOn: [{ standard: 'other', version: '3' }] }],
  options: { wcagCorrespondence: true },
  data: {
    1: {
      groups: [{ id: 'img', title: 'Images', requirements: ['1.1'] }],
      requirements: {
        1.1: {
          title: 'Images have an alternative',
          wcagSc: ['1.1.1'],
          tests: ['1.1.1'],
          basedOn: [{ standard: 'other', id: '9.1.1.1' }]
        }
      },
      tests: { '1.1.1': { title: 'An <img> has alt', requirements: ['1.1'], scope: 'page' } },
      ruleMap: { 'img-alt-present': { requirements: ['1.1.1'], note: 'presence' } }
    }
  },
  profiles: { 'two-1': { version: '1', tags: ['wcag2a', 'two'], mappedRules: true } }
};

const copy = (v) => JSON.parse(JSON.stringify(v));

test('valid data passes both the checker and the schema', () => {
  for (const data of [sampleData, twoLevel]) {
    assert.deepEqual(checkStandardData(data), [], data.key);
    assert.equal(validateSchema(data), true, JSON.stringify(validateSchema.errors));
  }
});

test('the checker and the schema refuse the same mistakes of shape', () => {
  const mistakes = {
    'no format': (d) => delete d.format,
    'another format': (d) => (d.format = 'other/2'),
    'a capital in the key': (d) => (d.key = 'Two'),
    'an unknown field': (d) => (d.colour = 'red'),
    'no versions': (d) => (d.versions = []),
    'a version without wcagVersion': (d) => delete d.versions[0].wcagVersion,
    'an unknown option': (d) => (d.options.weights = true),
    'applicability other than wcag': (d) => (d.options.applicability = 'own'),
    'a requirement without title': (d) => delete d.data[1].requirements['1.1'].title,
    'partial not boolean': (d) => (d.data[1].requirements['1.1'].partial = 'yes'),
    'an unknown scope': (d) => (d.data[1].tests['1.1.1'].scope = 'page set'),
    'a test of no requirement': (d) => (d.data[1].tests['1.1.1'].requirements = []),
    'basedOn without standard': (d) => (d.data[1].requirements['1.1'].basedOn = [{ id: 'x' }]),
    'an empty basedOn': (d) => (d.data[1].requirements['1.1'].basedOn = []),
    'a group without title': (d) => delete d.data[1].groups[0].title,
    'a group with neither requirements nor groups': (d) => delete d.data[1].groups[0].requirements,
    'a row without requirements': (d) => (d.data[1].ruleMap['img-alt-present'] = { note: 'x' }),
    'a row with an unknown field': (d) => (d.data[1].ruleMap['img-alt-present'].tests = []),
    'an outcome other than cantTell or fail': (d) =>
      (d.data[1].ruleMap['img-alt-present'].reasonCodes = { X: { outcome: 'pass' } }),
    'a finding without when': (d) => (d.data[1].ruleMap['img-alt-present'].findings = [{}])
  };
  for (const [name, change] of Object.entries(mistakes)) {
    const d = copy(twoLevel);
    change(d);
    assert.equal(validateSchema(d), false, `schema accepts: ${name}`);
    // The checker leaves rule rows to the entry's validate, which needs the rules.
    if (/row|outcome|finding/.test(name)) continue;
    assert.ok(checkStandardData(d).length > 0, `checker accepts: ${name}`);
  }
});

test('the checker also refuses what a schema cannot see', () => {
  const problems = (change) => {
    const d = copy(twoLevel);
    change(d);
    return checkStandardData(d).join('\n');
  };
  assert.match(
    problems((d) => (d.data[2] = d.data[1])),
    /data\.2: versions does not list 2/
  );
  assert.match(
    problems((d) => (d.data[1].tests['1.1.1'].requirements = ['9'])),
    /no requirement 9/
  );
  assert.match(
    problems((d) => (d.data[1].groups[0].requirements = ['7'])),
    /no requirement 7/
  );
  assert.match(
    problems((d) => d.data[1].groups.push({ id: 'again', title: 'Again', requirements: ['1.1'] })),
    /requirement 1\.1 is already in group img/
  );
  assert.match(
    problems((d) => (d.profiles['two-1'].version = '9')),
    /not one of the versions/
  );
  assert.match(
    problems((d) => {
      d.versions.push({ version: '2', wcagVersion: '2.2' });
      d.data[2] = { requirements: {}, ruleMap: {} };
    }),
    /a standard with tests has them in every version/
  );
  assert.match(
    problems((d) => (d.data[1].requirements['1.1'].title = () => 't')),
    /is not data/
  );
});

test('standardFromData gives the entry ruleMappedStandard gives for the same tables', () => {
  const entry = standardFromData(sampleData);
  const kit = ruleMappedStandard({
    standard: 'Sample Standard',
    tag: 'sample',
    versions: sampleData.versions,
    requirements: REQUIREMENTS,
    ruleMap: RULE_REQUIREMENTS
  });
  assert.deepEqual(entry.composites(), kit.composites());
  assert.deepEqual(
    entry.mappingsFor({ id: 'img-alt-present' }),
    kit.mappingsFor({ id: 'img-alt-present' })
  );
  assert.equal(entry.key, 'sample');
  assert.equal(entry.ruleTag, 'sample');
  assert.equal(entry.ruleMapped, true);
  assert.deepEqual(entry.versions, ['1.0', '2.0']);
  assert.deepEqual(entry.profiles, samplePack.standard.profiles);
});

test('the data comes with the entry, frozen, and extras add what data does not give yet', () => {
  const data = copy(twoLevel);
  const entry = standardFromData(data, { report: { noteKey: 'two_note' } });
  const kept = standardDataOf(entry);
  assert.deepEqual(kept, twoLevel);
  assert.ok(Object.isFrozen(kept.data[1].requirements['1.1']));
  // Changing the source afterwards changes nothing.
  data.data[1].requirements['1.1'].title = 'Changed';
  assert.equal(
    standardDataOf(entry).data[1].requirements['1.1'].title,
    'Images have an alternative'
  );
  assert.deepEqual(entry.report, { noteKey: 'two_note' });
  // Not enumerable: the entry serialises as before.
  assert.equal(Object.keys(entry).includes('data'), false);
  // Groups need procedures, which a two-level standard doesn't get from data yet.
  assert.equal('groups' in entry, false);
  assert.equal(standardDataOf({}), null);
});

test('standardFromData refuses data with a problem, naming it', () => {
  assert.throws(
    () => standardFromData({ ...copy(twoLevel), format: 'x' }),
    /two: format must be "surea11y-standard\/1"/
  );
  assert.throws(() => standardFromData(twoLevel, 'extras'), /extras must be an object/);
});

test('the sample standard built from data scans as the sample pack does', () => {
  const fromData = definePack({
    name: 'sample-pack',
    version: '1.0.0',
    namespace: 'sample',
    core: '>=1.10.0',
    rules: samplePack.rules,
    standard: standardFromData(sampleData, { report: samplePack.standard.report }),
    dictionaries: samplePack.dictionaries
  });
  const html =
    '<html lang="en"><head><title>Report</title></head><body><main>' +
    '<img src="a.png"><h1>Quarterly results</h1><h3>Sales by region</h3>' +
    '<p style="color:#767676;background:#fff">Grey text</p></main></body></html>';
  for (const profile of Object.keys(samplePack.standard.profiles)) {
    const scan = (pack) => runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile } });
    const a = scan(samplePack);
    const b = scan(fromData);
    assert.deepEqual(
      b.rulesResults.map((r) => [r.ruleId, r.outcome, r.meta.normativeMappings]),
      a.rulesResults.map((r) => [r.ruleId, r.outcome, r.meta.normativeMappings]),
      profile
    );
    assert.deepEqual(
      b.checksResults.map((r) => [r.ruleId, r.outcome, r.meta.normativeMappings]),
      a.checksResults.map((r) => [r.ruleId, r.outcome, r.meta.normativeMappings]),
      profile
    );
  }
});
