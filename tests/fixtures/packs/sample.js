'use strict';

/**
 * The sample profile (tests/fixtures/profiles/sample) as a pack: the same
 * standard, rules and dictionaries, passed to a scan in engineOptions.packs
 * instead of built into a copy of the engine. Its results must be the sample
 * engine's (tests/packs/sample-pack.test.js).
 */

const fs = require('fs');
const path = require('path');

const { definePack, ruleMappedStandard } = require('../../../src/pack.js');

const PROFILE = path.join(__dirname, '..', 'profiles', 'sample');
const { VERSIONS, REQUIREMENTS } = require(path.join(PROFILE, 'requirements'));
const { RULE_REQUIREMENTS } = require(path.join(PROFILE, 'rule-map'));

const { mappingsFor, composites, validate, wcagTagsOf } = ruleMappedStandard({
  standard: 'Sample Standard',
  tag: 'sample',
  versions: VERSIONS,
  requirements: REQUIREMENTS,
  ruleMap: RULE_REQUIREMENTS
});

const standard = {
  key: 'sample',
  standard: 'Sample Standard',
  versions: VERSIONS.map((v) => v.version),
  profiles: {
    'sample-1.0': {
      version: '1.0',
      tags: wcagTagsOf('1.0').concat(['sample']),
      mappedRules: true
    },
    'sample-2.0': {
      version: '2.0',
      tags: wcagTagsOf('2.0').concat(['sample']),
      mappedRules: true,
      exclude: { criteria: ['3.3.8'] }
    }
  },
  ruleTag: 'sample',
  ruleMapped: true,
  mappingsFor,
  composites,
  validate,
  report: { noteKey: 'report_sampleRollup_note' }
};

const rulesDir = path.join(PROFILE, 'rules', 'automatic');
const rules = fs
  .readdirSync(rulesDir)
  .filter((f) => f.endsWith('.js'))
  .sort()
  .map((f) => require(path.join(rulesDir, f)));

const i18nDir = path.join(PROFILE, 'i18n');
const dictionaries = Object.fromEntries(
  fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [
      f.replace(/\.json$/, ''),
      JSON.parse(fs.readFileSync(path.join(i18nDir, f), 'utf8'))
    ])
);

module.exports = definePack({
  name: 'sample-pack',
  version: '1.0.0',
  namespace: 'sample',
  core: '>=1.10.0',
  rules,
  standard,
  dictionaries
});
