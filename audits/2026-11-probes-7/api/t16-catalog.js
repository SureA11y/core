const core = require('/home/user/core/src/index.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const html = require('./page.js');
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  const combos = [
    [{ profile: 'wcag22-aa' }, null], [{ profile: ['wcag22-aa', 'sample-1.0'], packs: [sample] }, null], [{ profile: ['wcag20-a', 'en301549-v3.2.1'] }, null],
    [{ profile: ['sample-2.0', 'wcag21-aaa'], packs: [sample] }, null], [{}, { wcag: { version: '2.1', level: 'AA' } }], [{}, { wcag: { version: '2.2', level: 'AA' }, bestPractices: true }],
    [{ profile: ['wcag22-aa', 'wcag21-a'] }, { excludeRuleIds: ['img-alt-present'] }], [{ profile: ['wcag22-aa', 'sample-1.0'], packs: [sample] }, ['wcag-1.1.1-non-text-content']],
    [{ profile: ['wcag22-aa','sample-1.0'], packs: [sample], wcagLevel: 'A' }, null],
  ];
  for (const [eo, ro] of combos) {
    const checks = core.getChecksForRunOnly(ro, eo).map(c => c.id || c.ruleId).sort();
    const rules = core.getRulesForRunOnly(ro, eo).map(c => c.id).sort();
    const r = await runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ro }); await tick();
    const sc = r.checksResults.map(c => c.ruleId).sort(); const sr = r.rulesResults.map(c => c.ruleId).sort();
    const d = (x, y) => x.filter(i => !y.includes(i));
    console.log(JSON.stringify(eo.profile || ro), 'checks cat-scan', d(checks, sc).slice(0,5), 'scan-cat', d(sc, checks).slice(0,5), '| rollups cat-scan', d(rules, sr).slice(0,5), 'scan-cat', d(sr, rules).slice(0,5), checks.length, sc.length, rules.length, sr.length);
  }
})();
