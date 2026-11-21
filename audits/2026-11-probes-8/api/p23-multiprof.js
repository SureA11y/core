const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><div role="grid"></div><a href="x"></a></main></body></html>';
const cases = {
  dupCase: { packs: ps, profile: ['wcag22-aa', 'WCAG22-AA'] },
  withUnknown: { packs: ps, profile: ['wcag22-aa', 'nope'] },
  allUnknown: { packs: ps, profile: ['nope', 'nope2'] },
  withUnknownStrict: { packs: ps, profile: ['wcag22-aa', 'nope'], strictOptions: true },
  emptyStrList: { packs: ps, profile: ['wcag22-aa', ''] },
  nullInList: { packs: ps, profile: ['wcag22-aa', null] },
  holeInList: { packs: ps, profile: ['wcag22-aa', , 'wai-aria-1.2'] },
  nested: { packs: ps, profile: [['wcag22-aa']] },
  deprecatedAndPack: { packs: ps, profile: ['en301549-v4.1.1', 'wcag22-aa'] },
  deprecatedNoPack: { profile: ['en301549-v4.1.1', 'wcag22-aa'] },
  sectionAndWcag: { profile: ['section508', 'wcag20-aa'] },
  twoWcag: { profile: ['wcag21-aa', 'wcag22-aaa'] },
  wcagVersionOverride: { packs: ps, profile: ['wcag21-aa', 'wai-aria-1.2'], wcagVersion: '2.2' },
  wcagLevelOverride: { packs: ps, profile: ['wcag22-aaa', 'wai-aria-1.2'], wcagLevel: 'A' },
  withRunOnlyBP: { packs: ps, profile: ['wcag22-aa', 'wai-aria-1.2'], __ro: { bestPractices: true } },
  withRunOnlyTags: { packs: ps, profile: ['wcag22-aa', 'wai-aria-1.2'], __ro: { tags: ['wcag412'] } },
  withExclude: { packs: ps, profile: ['wcag22-aa', 'wai-aria-1.2'], __ro: { excludeRuleIds: ['aria-role-name-present'] } },
  rgaaRaweb: { packs: ps, profile: ['rgaa-4.1.2', 'raweb-1.1'] },
  rawebNoRgaa: { packs: ps.filter((p, i) => i !== 0), profile: ['raweb-1.1'] },
  hugeList: { packs: ps, profile: Array.from({ length: 2000 }, (_, i) => ['wcag22-aa', 'wai-aria-1.2'][i % 2]) },
};
(async () => {
  const warns = []; console.warn = (...a) => warns.push(String(a[0]).slice(0, 140)); console.info = () => {};
  for (const [k, eo0] of Object.entries(cases)) {
    warns.length = 0; const eo = { ...eo0 }; const ro = eo.__ro || null; delete eo.__ro;
    const t = Date.now(); let line;
    try {
      const r = await runa11yCoreOnHtml(html, { engineOptions: eo, runOnly: ro });
      let s, j; try { s = JSON.parse(renderSarifReport(r)).runs[0].invocations[0].executionSuccessful; } catch (e) { s = 'THROW ' + e.message.slice(0, 50); }
      try { j = (renderJunitReport(r).match(/<testsuites[^>]*errors="(\d+)"/) || [])[1]; } catch (e) { j = 'THROW ' + e.message.slice(0, 50); }
      let cat; try { cat = core.getChecksForRunOnly(ro, eo).length; } catch (e) { cat = 'THROW ' + e.code; }
      line = `profile=${JSON.stringify(r.engine.profile)} profiles=${JSON.stringify(r.engine.profiles)} notRun=${JSON.stringify(r.engine.profilesNotRun)} wcagV=${r.engine.wcagVersion} lvl=${r.engine.wcagLevel} n=${r.checksResults.length} cat=${cat} rollups=${r.rulesResults.length} sarifOK=${s} junitErr=${j}`;
    } catch (e) { line = 'THROW ' + (e.code || '') + ' ' + e.message.slice(0, 160); }
    console.log(k.padEnd(20), (Date.now() - t + 'ms').padEnd(8), line, warns.length ? '\n     warns: ' + [...new Set(warns)].slice(0, 3).join(' | ') : '');
  }
})();
