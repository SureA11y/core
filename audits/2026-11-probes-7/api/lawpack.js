const path = require('path');
const { definePack, ruleMappedStandard } = require('/home/user/core/src/pack.js');
const PROFILE = '/home/user/core/tests/fixtures/profiles/sample';
const { VERSIONS, REQUIREMENTS } = require(path.join(PROFILE, 'requirements'));
const { RULE_REQUIREMENTS } = require(path.join(PROFILE, 'rule-map'));
module.exports = (opts = {}) => {
  const ns = 'sample'; const sp = require('/home/user/core/tests/fixtures/packs/sample.js');
  const { mappingsFor, composites, validate, wcagTagsOf } = ruleMappedStandard({ standard: 'Lawy Standard ' + ns, tag: ns, versions: VERSIONS, requirements: REQUIREMENTS, ruleMap: RULE_REQUIREMENTS });
  return definePack({
    name: 'sample-law-pack', version: '1.0.0', namespace: ns, core: '>=1.16.0', rules: sp.rules, dictionaries: sp.dictionaries,
    standard: {
      key: ns, standard: 'Lawy Standard ' + ns, versions: VERSIONS.map(v => v.version), ruleTag: ns, ruleMapped: true, mappingsFor, composites, validate,
      laws: { [ns + '-law-a']: { name: 'Law A <b>&amp;</b>', jurisdiction: 'FR', sources: [{ title: 'src', url: 'https://example.org/a' }] }, [ns + '-law-b']: { name: 'Law B', jurisdiction: 'DE-BY' } },
      lawTexts: opts.lawTexts || { 'fr-ca': { ['laws.' + ns + '-law-a.name']: 'Loi A' } },
      profiles: {
        [ns + '-1.0']: { version: '1.0', tags: wcagTagsOf('1.0').concat([ns]), mappedRules: true, law: ns + '-law-a' },
        [ns + '-2.0']: { version: '2.0', tags: wcagTagsOf('2.0').concat([ns]), mappedRules: true, law: ns + '-law-b' },
        [ns + '-2.0a']: { version: '2.0', tags: wcagTagsOf('2.0').concat([ns]), mappedRules: true, law: ns + '-law-a' },
      },
    },
  });
};
