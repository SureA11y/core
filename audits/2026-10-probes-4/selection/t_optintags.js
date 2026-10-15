const L = require('./lib');
for (const ro of [{ optInTags: ['sample'] }, { optInTags: ['sample'], includeRuleIds: ['img-alt-present'] }, { optInTag: ['sample'], includeRuleIds: ['img-alt-present'] }]) {
  const s = L.scan(ro, { packs: [L.samplePack] });
  console.log(JSON.stringify(ro), s.error ? 'THROW ' + s.error.message : s.value.checksResults.length + ' checks, rollups ' + s.value.rulesResults.map((r) => r.ruleId).join(','), s.warned.map((w) => w.slice(0, 160)));
}
