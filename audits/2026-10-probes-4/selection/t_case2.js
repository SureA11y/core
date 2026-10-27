const L = require('./lib'); const { core } = L;
for (const id of ['wcag-2.4.4-link-purpose-in-context', 'WCAG-2.4.4-LINK-PURPOSE-IN-CONTEXT']) {
  for (const ro of [{ includeTestIds: [id] }, { tags: ['links'], excludeTestIds: [id] }]) {
    const s = L.scan(ro, {});
    console.log(JSON.stringify(ro), s.error ? 'THROW ' + s.error.message : s.value.checksResults.map((c) => c.ruleId) + ' | ' + s.value.rulesResults.map((r) => r.ruleId), s.warned.map((w) => w.slice(0, 200)));
  }
}
const s = L.scan({ includeRuleIds: ['link-name-present'] }, { rules: { 'link-name-present': { severity: 'minor' } } });
console.log(s.value.checksResults[0].severity, s.warned);
