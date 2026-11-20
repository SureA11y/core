const { definePack, ruleMappedStandard } = require('/home/user/core/src/pack.js');
const VERSIONS = [{ version: '1.0', wcagVersion: '2.2' }];
const REQUIREMENTS = { '1.0': { NR: { title: 'Name required', wcagSc: [] }, LC: { title: 'Lists', wcagSc: [] } } };
const RULE_REQUIREMENTS = { '1.0': {
  'aria-role-name-present': { requirements: ['NR'], reasonCodes: { name_missing: { outcome: 'fail' } } },
  'list-children-valid': { requirements: ['LC'], reasonCodes: { LIST_INVALID_CHILD: { outcome: 'fail' } } },
} };
const { mappingsFor, composites, validate } = ruleMappedStandard({ standard: 'AW', tag: 'aw', versions: VERSIONS, requirements: REQUIREMENTS, ruleMap: RULE_REQUIREMENTS });
module.exports = definePack({ name: 'aw-pack', version: '1.0.0', namespace: 'aw', core: '>=1.15.0',
  standard: { key: 'aw', standard: 'AW', versions: ['1.0'], ruleTag: 'aw', ruleMapped: true, mappingsFor, composites, validate,
    profiles: { 'aw-1.0': { version: '1.0', tags: [], rules: ['aria-role-name-present', 'list-children-valid'], mappedRules: true } } } });
