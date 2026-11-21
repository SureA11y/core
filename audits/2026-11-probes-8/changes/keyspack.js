const { definePack, ruleMappedStandard } = require('/home/user/core-r8/src/pack.js');
module.exports = function make(ruleMapExtra) {
const requirements = { '1.0': { N1: { title: 'Roles that require a name have one', wcagSc: ['4.1.2'] } } };
const ruleMap = { '1.0': Object.assign({ 'aria-role-name-present': { requirements: ['N1'], reasonCodes: { name_missing: { outcome: 'fail' } } } }, ruleMapExtra || {}) };
const std = ruleMappedStandard({ standard: 'Keys Standard', tag: 'keys', versions: [{ version: '1.0', wcagVersion: '2.2' }], requirements, ruleMap });
return definePack({ name: 'keys-pack', version: '1.0.0', namespace: 'keys', core: '*',
  standard: { key: 'keys', standard: 'Keys Standard', versions: ['1.0'],
    profiles: { 'keys-1.0': { version: '1.0', tags: ['keys'], mappedRules: true } },
    ruleTag: 'keys', ruleMapped: true, mappingsFor: std.mappingsFor, composites: std.composites, validate: std.validate } });
};
