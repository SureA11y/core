const L = require('./lib'); const PK = require('./packs');
for (const [ro, eo] of [
  [{ tags: ['probe'] }, { packs: [PK.standardPack] }],
  [{ tags: ['probe', 'org'] }, { packs: [PK.standardPack] }],
  [{ tags: ['probe', 'org'] }, { packs: [PK.standardPack], customRules: [L.custom('org-x', { tags: ['org'] })] }],
  [{ tags: ['wcag244', 'org'] }, { }],
]) {
  const s = L.scan(ro, eo);
  console.log(JSON.stringify(ro), s.error ? 'ERR ' + s.error.message : s.value.rulesResults.map((r) => r.ruleId + ':' + r.outcome).join(','), s.warned);
}
