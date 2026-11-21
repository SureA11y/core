const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { occurrenceOutcome } = require('/home/user/core-r8/src/index.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const B = require('/home/user/core-r8/src/baseline.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
const fs = require('fs');
const dir = '/home/user/core-r8/tests/fixtures/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const profileSets = [['wcag22-aa', 'rgaa-4.1.2', 'wai-aria-1.2'], 'wai-aria-1.2', 'rgaa-4.1.2', ['en301549-v4.1.1', 'raweb-1.1']];
const start = +(process.argv[2] || 0), end = +(process.argv[3] || files.length);
(async () => {
  console.warn = () => {}; console.info = () => {}; console.log = ((l) => (...a) => l(...a))(console.log);
  let n = 0;
  for (const f of files.slice(start, end)) {
    const html = fs.readFileSync(dir + f, 'utf8');
    for (const prof of profileSets) {
      let r;
      try { r = await runa11yCoreOnHtml(html, { engineOptions: { packs: ps, profile: prof } }); } catch (e) { console.log(f, prof, 'THROW', e.message.slice(0, 200)); continue; }
      const failRules = new Set(), failOccKeys = [];
      for (const c of r.checksResults) for (const o of c.occurrences || []) if (occurrenceOutcome(c, o) === 'fail') { failRules.add(c.ruleId); failOccKeys.push(c.ruleId); }
      const outcomeFail = new Set(r.checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId));
      const s = JSON.parse(renderSarifReport(r, { packs: ps, allowProfilesNotRun: true }));
      const sErr = s.runs[0].results.filter(x => x.level === 'error');
      const j = renderJunitReport(r, { packs: ps, allowProfilesNotRun: true });
      const jRules = new Set([...j.matchAll(/<testcase[^>]*name="([^"]*)"[^>]*>\s*<failure/g)].map(m => m[1]));
      const bl = B.buildBaselineEntries(r);
      const diffs = [];
      const eq = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
      if (!eq(failRules, outcomeFail)) diffs.push('occ-vs-outcome ' + [...failRules] + ' / ' + [...outcomeFail]);
      if (sErr.length !== failOccKeys.length) diffs.push('sarif ' + sErr.length + ' vs ' + failOccKeys.length);
      if (bl.length !== failOccKeys.length) diffs.push('baseline ' + bl.length + ' vs ' + failOccKeys.length);
      if (jRules.size && !eq(new Set([...jRules].map(x => x.replace(/^.*?:\s*/, ''))), failRules) && jRules.size !== failRules.size) diffs.push('junit ' + [...jRules].join(',') + ' vs ' + [...failRules]);
      if (diffs.length) console.log(f, JSON.stringify(prof), diffs.join(' | '));
      n++;
    }
  }
  console.log('done', n);
})();
