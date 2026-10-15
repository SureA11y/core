const L = require('./lib'); const { core } = L;
for (const id of ['sample-1.0-S6', 'SAMPLE-1.0-S6', 'a11ycore-sample-1.0-S6', 'A11YCORE-SAMPLE-1.0-S6', 'sample-1.0-S7', 'a11ycore-sample-1.0-S7', 'a11ycore-wcag-1.1.1-non-text-content']) {
  for (const form of ['runOnly', 'rules']) {
    const [ro, eo] = form === 'runOnly' ? [{ includeRuleIds: [id] }, { packs: [L.samplePack] }] : [null, { packs: [L.samplePack], rules: { include: [id] } }];
    const s = L.scan(ro, eo);
    const g = L.capture(() => core.getChecksForRunOnly(ro, eo));
    console.log(id.padEnd(40), form.padEnd(8), s.error ? 'THROW ' + s.error.message : 'checks=' + s.value.checksResults.map((c) => c.ruleId + ':' + c.outcome).join(',') + ' | rollups=' + s.value.rulesResults.map((r) => r.ruleId + ':' + r.outcome).join(','), s.warned.map(w=>w.slice(0,200)), '| list checks=', g.value ? g.value.map(x=>x.ruleId).join(',') : 'THROW');
  }
}
