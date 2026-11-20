const { sd, base, mkPack, runa11yCoreOnHtml } = require('./lib.js');
const d = base();
d.data[1].tests = { T: { title: 'Shared test', requirements: ['A', 'B'] } };
d.data[1].ruleMap = { 'img-alt-present': { requirements: ['T'] } };
const p = mkPack(sd.standardFromData(d));
const r = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>', { engineOptions: { packs: [p], profile: 'base-1' } });
for (const x of r.rulesResults.filter((x) => /^base-1-/.test(x.ruleId))) {
  console.log(x.ruleId, x.outcome, JSON.stringify((x.meta.normativeMappings || []).filter((m) => m.standard === 'Base').map((m) => ({ requirement: m.requirement, criterion: m.criterion, wcagSc: m.wcagSc }))));
}
const chk = r.checksResults.find((c) => c.ruleId === 'img-alt-present');
console.log('rule mappings:', JSON.stringify(chk.meta.normativeMappings.filter((m) => m.standard === 'Base').map((m) => ({ requirement: m.requirement, criterion: m.criterion }))));
