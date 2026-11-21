const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><div role="grid"></div><a href="x"></a></main></body></html>';
const cr = { id: 'org-x', meta: { title: 'T', description: 'd', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } };
const crBp = { id: 'org-bp', meta: { title: 'T', description: 'd', tags: ['best-practice'] }, runInPage() { return { outcome: 'pass', occurrences: [] }; } };
const cases = [
  [{}, null], [{}, ['img-alt-present']], [{}, { tags: ['wcag111'] }], [{ wcagLevel: 'A' }, { wcag: { version: '2.2', level: 'AAA' } }],
  [{ profile: 'wcag21-a' }, null], [{ profile: 'wcag22-aaa', wcagLevel: 'aa' }, null], [{ profile: 'wcag21-aa', wcagVersion: '2.0' }, null],
  [{ packs: ps, profile: 'rgaa-4.1.2' }, null], [{ packs: ps, profile: ['wcag22-aa', 'wai-aria-1.2'] }, null],
  [{ packs: ps, profile: ['rgaa-4.1.2', 'raweb-1.1'] }, null], [{ packs: ps, profile: 'en301549-v3.2.1' }, null],
  [{ packs: ps, profile: 'wai-aria-1.2' }, { bestPractices: true }], [{ packs: ps, profile: ['wcag22-aa', 'wai-aria-1.2'] }, { excludeRuleIds: ['img-alt-present'] }],
  [{ customRules: [cr] }, ['org-x']], [{ customRules: [cr, crBp], profile: 'wcag22-aa' }, null], [{ customRules: [cr] }, { wcag: { version: '2.0', level: 'A' } }],
  [{ optInRules: 'all', packs: ps }, null], [{ packs: ps }, { tags: ['rgaa'] }], [{ packs: ps, profile: 'rgaa-4.1.2' }, ['rgaa-4.1.2-1.1']],
  [{}, ['wcag-1.1.1-non-text-content']], [{ packs: ps, profile: ['wcag22-aa', 'rgaa-4.1.2'], wcagLevel: 'A' }, null],
];
(async () => {
  console.warn = () => {}; console.info = () => {};
  for (const [eo, ro] of cases) {
    let line;
    try {
      const r = await runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ro });
      const scanIds = new Set(r.rulesResults.map(x => x.ruleId));
      const catIds = new Set(core.getRulesForRunOnly(ro, eo).map(x => x.id));
      const checkScan = new Set(r.checksResults.map(c => c.ruleId)), checkCat = new Set(core.getChecksForRunOnly(ro, eo).map(c => c.ruleId));
      const d = (a, b) => [...a].filter(x => !b.has(x));
      line = `rollups scan=${scanIds.size} cat=${catIds.size} onlyScan=${JSON.stringify(d(scanIds, catIds).slice(0, 4))} onlyCat=${JSON.stringify(d(catIds, scanIds).slice(0, 4))} | checks scan=${checkScan.size} cat=${checkCat.size} onlyScan=${JSON.stringify(d(checkScan, checkCat).slice(0, 3))} onlyCat=${JSON.stringify(d(checkCat, checkScan).slice(0, 3))}`;
    } catch (e) { line = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 150); }
    const label = JSON.stringify({ ...eo, packs: eo.packs ? 'P' : undefined, customRules: eo.customRules ? eo.customRules.map(c => c.id) : undefined }) + ' ' + JSON.stringify(ro);
    console.log(label.slice(0, 110).padEnd(110), line);
  }
})();
