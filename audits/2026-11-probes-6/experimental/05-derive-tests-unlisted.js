const { sd, deriveStandard, base, mkPack } = require('./lib.js');
// Base: requirement A has tests A.1, A.2 declared only on the test side (requirement.tests omitted: allowed).
const b = base();
b.data[1].tests = { 'A.1': { title: 'alt present', requirements: ['A'] }, 'A.2': { title: 'alt good', requirements: ['A'] }, 'B.1': { title: 'labels', requirements: ['B'] } };
b.data[1].ruleMap = { 'img-alt-present': { requirements: ['A.1'] }, 'form-control-programmatic-label-present': { requirements: ['B.1'] } };
mkPack(sd.standardFromData(b)); // the base itself is a valid pack
const out = deriveStandard([b], {
  format: 'surea11y-standard/1', key: 'der', standard: 'Derived',
  versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
  data: { 1: { requirements: { A: { basedOn: [{ standard: 'base', id: 'A' }] }, B: { basedOn: [{ standard: 'base', id: 'B' }] } }, ruleMap: {} } },
  profiles: { 'der-1': { version: '1', tags: ['der'], mappedRules: true } }
});
console.log('derived tests:', JSON.stringify(out.data[1].tests));
console.log('derived ruleMap:', JSON.stringify(out.data[1].ruleMap));
// Same base, but requirement A lists its tests explicitly:
b.data[1].requirements.A.tests = ['A.1', 'A.2'];
const out2 = deriveStandard([b], {
  format: 'surea11y-standard/1', key: 'der', standard: 'Derived',
  versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
  data: { 1: { requirements: { A: { basedOn: [{ standard: 'base', id: 'A' }] }, B: { basedOn: [{ standard: 'base', id: 'B' }] } }, ruleMap: {} } }
});
console.log('with A.tests listed -> tests:', Object.keys(out2.data[1].tests || {}), 'ruleMap:', JSON.stringify(out2.data[1].ruleMap));
