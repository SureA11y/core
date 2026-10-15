const L = require('./lib'); const PK = require('./packs');
const { core } = L;
const c = core.getChecksCatalog({ packs: [PK.standardPack] });
console.log(c.filter((x) => /probe/.test(x.ruleId)).map((x) => [x.ruleId, x.tags]));
console.log(core.getChecksCatalog({ packs: [L.samplePack] }).filter((x) => /sample/.test(x.ruleId)).map((x) => [x.ruleId, x.tags]));
for (const [ro, eo] of [
  [{ tags: ['sample'] }, { packs: [L.samplePack] }],
  [{ tags: ['sample', 'wcag244'] }, { packs: [L.samplePack] }],
  [{ tags: ['probe', 'wcag244'] }, { packs: [PK.standardPack] }],
  [null, { packs: [PK.standardPack], tags: { include: ['probe'] } }],
]) {
  const s = L.scan(ro, eo);
  console.log(JSON.stringify(ro), JSON.stringify(eo.tags||''), s.error ? 'ERR ' + s.error.message : s.value.rulesResults.map((r) => r.ruleId + ':' + r.outcome).join(',') + ' | checks ' + s.value.checksResults.map(r=>r.ruleId).join(','), s.warned);
}
