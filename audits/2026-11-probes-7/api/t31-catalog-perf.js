const core = require('/home/user/core/src/index.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const ids = core.getChecksCatalog().map(c => c.ruleId);
for (const [label, eo] of [['none', undefined], ['profile', { profile: 'wcag22-aa' }], ['packs', { packs: [sample], profile: ['wcag22-aa', 'sample-1.0'] }], ['custom', { customRules: [{ id: 'org-a', meta: { title: 't', description: 'd', tags: ['wcag111'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } }] }]]) {
  for (const [fn, call] of [['getCheckDefById', (i) => core.getCheckDefById(ids[i % ids.length], eo)], ['getChecksCatalog', () => core.getChecksCatalog(eo)], ['getRulesForRunOnly', () => core.getRulesForRunOnly(null, eo)], ['getCompositeRuleById', () => core.getCompositeRuleById('wcag-1.1.1-non-text-content', eo)], ['getProfileWcagTarget', () => core.getProfileWcagTarget('wcag22-aa')]]) {
    const t = process.hrtime.bigint(); const N = 200; for (let i = 0; i < N; i++) call(i);
    console.log(label.padEnd(8), fn.padEnd(22), (Number(process.hrtime.bigint() - t) / 1e6 / N).toFixed(2), 'ms/call');
  }
}
