const { sd, deriveStandard, base, copy, mkPack, both } = require('./lib.js');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { console.log(label, '-> THROWS', e.message.slice(0, 400)); } };
const twoLevelBase = () => {
  const b = base();
  b.data[1].tests = { 'A.1': { title: 'alt present', requirements: ['A'] }, 'A.2': { title: 'alt good', requirements: ['A'] }, 'B.1': { title: 'labels', requirements: ['B'] } };
  b.data[1].requirements.A.tests = ['A.1', 'A.2'];
  b.data[1].ruleMap = {
    'img-alt-present': { requirements: ['A.1'] },
    'img-alt-quality': { requirements: [], asks: ['A.2'] },
    'form-control-programmatic-label-present': { requirements: ['B.1'], findings: [{ when: { reasonCode: 'X' }, requirements: ['A.1'] }] },
    'contrast-minimum': { requirements: ['B.1'], reasonCodes: { LOW: { requirements: ['A.2'], outcome: 'cantTell' } } }
  };
  return b;
};
const own = (reqs, extra = {}) => ({
  format: 'surea11y-standard/1', key: 'der', standard: 'Derived',
  versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
  data: { 1: { requirements: reqs, ruleMap: {}, ...extra } },
  profiles: { 'der-1': { version: '1', tags: ['der'], mappedRules: true } }
});
// D1: two derived requirements based on the same base requirement with tests
tryIt('D1 two derived reqs share a base req with tests: derive', () => {
  const out = deriveStandard([twoLevelBase()], own({ X: { basedOn: [{ standard: 'base', id: 'A' }] }, Y: { basedOn: [{ standard: 'base', id: 'A' }] } }));
  return { reqs: out.data[1].requirements, tests: out.data[1].tests };
});
tryIt('D1 ... then definePack', () => {
  const out = deriveStandard([twoLevelBase()], own({ X: { basedOn: [{ standard: 'base', id: 'A' }] }, Y: { basedOn: [{ standard: 'base', id: 'A' }] } }));
  mkPack(sd.standardFromData(out)); return 'ok';
});
// D2: route (findings/reasonCodes) to a unit the derived standard drops
tryIt('D2 derived keeps only B: inherited rows', () => {
  const out = deriveStandard([twoLevelBase()], own({ B: { basedOn: [{ standard: 'base', id: 'B' }] } }));
  return out.data[1].ruleMap;
});
tryIt('D2 ... then definePack', () => {
  const out = deriveStandard([twoLevelBase()], own({ B: { basedOn: [{ standard: 'base', id: 'B' }] } }));
  mkPack(sd.standardFromData(out)); return 'ok';
});
// D3: version basedOn the same standard twice (two versions)
const b2 = () => { const b = base(); b.versions.push({ version: '2', wcagVersion: '2.2' }); b.data[2] = copy(b.data[1]); b.data[2].requirements.A.title = 'Images v2'; b.profiles['base-2'] = { version: '2', tags: ['base'] }; return b; };
tryIt('D3 version basedOn base@1 and base@2', () => {
  const o = own({ A: { basedOn: [{ standard: 'base', id: 'A' }] } });
  o.versions[0].basedOn = [{ standard: 'base', version: '1' }, { standard: 'base', version: '2' }];
  const out = deriveStandard([b2()], o); return out.data[1].requirements.A.title;
});
// D4: version basedOn with no version
tryIt('D4 version basedOn without version', () => {
  const o = own({ A: { basedOn: [{ standard: 'base', id: 'A' }] } });
  o.versions[0].basedOn = [{ standard: 'base' }]; deriveStandard([base()], o); return 'ok';
});
// D5: own key equals base key (self-derivation)
tryIt('D5 derived key == base key', () => {
  const o = own({ A: { basedOn: [{ standard: 'base', id: 'A' }] } }); o.key = 'base'; o.profiles = { 'base-1': { version: '1', tags: ['base'] } };
  const out = deriveStandard([base()], o); return out.key + ' ' + JSON.stringify(out.data[1].requirements.A);
});
// D6: basedOn on own entry naming own standard (cycle attempt)
tryIt('D6 entry basedOn its own standard (not among bases)', () => {
  const o = own({ A: { basedOn: [{ standard: 'der', id: 'A' }] } }); deriveStandard([base()], o); return 'ok';
});
// D7: derived requirement basedOn a derived test in its own data? A requirement based on itself
tryIt('D7 base listed twice', () => { deriveStandard([base(), base()], own({})); return 'ok'; });
// D8: own row override, null drop of inherited row; null for a rule not inherited
tryIt('D8 null drops, own replaces', () => {
  const o = own({ A: { basedOn: [{ standard: 'base', id: 'A' }] }, B: { basedOn: [{ standard: 'base', id: 'B' }] } });
  o.data[1].ruleMap = { 'img-alt-present': null, 'form-control-programmatic-label-present': { requirements: ['A'] }, 'not-a-rule': null };
  return deriveStandard([base()], o).data[1].ruleMap;
});
// D9: null rows in own data — does the derived output still contain nulls? (checks/schema)
// D10: own null row passes through checkStandardData of own? schema rejects null rows: own data is not valid standard data.
tryIt('D10 own data with null row vs schema', () => { const o = own({}); o.data[1].ruleMap = { x: null }; both('   own-with-null-row', o); return ''; });
// D11: derived entry based on base test (kind test) becomes a requirement
tryIt('D11 requirement based on a base test', () => {
  const out = deriveStandard([twoLevelBase()], own({ R: { basedOn: [{ standard: 'base', id: 'A.1' }] } }));
  return { R: out.data[1].requirements.R, ruleMap: out.data[1].ruleMap };
});
// D12: requirement basedOn two base requirements: fields from first only; rows from both
tryIt('D12 basedOn [A, B]', () => {
  const out = deriveStandard([base()], own({ M: { basedOn: [{ standard: 'base', id: 'A' }, { standard: 'base', id: 'B' }] } }));
  return { M: out.data[1].requirements.M, ruleMap: out.data[1].ruleMap };
});
// D13: own review null for something not inherited, own texts for dropped key
tryIt('D13 derived from two bases, same rule both', () => {
  const b1 = base(); const b2x = base({ key: 'other', standard: 'Other' }); b2x.profiles = {};
  const o = own({ A: { basedOn: [{ standard: 'base', id: 'A' }] }, A2: { basedOn: [{ standard: 'other', id: 'A' }] } });
  o.versions[0].basedOn.push({ standard: 'other', version: '1' });
  return deriveStandard([b1, b2x], o).data[1].ruleMap;
});
