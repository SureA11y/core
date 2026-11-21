const F = '/tmp/surea11y-audit/scratch/family/';
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { renderSarifReport } = require('/home/user/core-r8/src/sarif.js');
const { renderJunitReport } = require('/home/user/core-r8/src/junit.js');
const { renderEarlReport } = require('/home/user/core-r8/src/earl.js');
const { renderHtmlReport } = require('/home/user/core-r8/src/report.js');
const B = require('/home/user/core-r8/src/baseline.js');
const core = require('/home/user/core-r8/src/index.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-wai-aria'].map(n => require(F + n));
const fs = require('fs');
const html = fs.readFileSync('/home/user/core-r8/tests/fixtures/' + (process.argv[2] || 'all-pass.html'), 'utf8');
console.warn = () => {}; console.info = () => {};
for (const prof of ['wcag22-aa', ['wcag22-aa', 'wai-aria-1.2'], 'rgaa-4.1.2']) {
  const eo = { packs: ps, profile: prof, timestamp: '2026-01-01T00:00:00Z' };
  const full = runa11yCoreOnHtml(html, { engineOptions: eo });
  const comp = runa11yCoreOnHtml(html, { engineOptions: { ...eo, output: { detail: 'findings' } } });
  const norm = (s) => s.replace(/findings|outputDetail[^,]*,?/g, '');
  const sarifNoInv = (r) => { const s = JSON.parse(renderSarifReport(r, { packs: ps })); return JSON.stringify(s.runs[0].results); };
  const out = {
    sarifResults: sarifNoInv(full) === sarifNoInv(comp),
    junit: renderJunitReport(full, { packs: ps, includeNotApplicable: true }) === renderJunitReport(comp, { packs: ps, includeNotApplicable: true }),
    earl: JSON.stringify(renderEarlReport(full)) === JSON.stringify(renderEarlReport(comp)),
    baseline: JSON.stringify(B.buildBaselineEntries(full)) === JSON.stringify(B.buildBaselineEntries(comp)),
    leaning: JSON.stringify(core.leaningFailures(full)) === JSON.stringify(core.leaningFailures(comp)),
    margins: JSON.stringify(core.getMargins(full)) === JSON.stringify(core.getMargins(comp)),
    htmlLen: renderHtmlReport(full, { packs: ps }).length + ' vs ' + renderHtmlReport(comp, { packs: ps }).length,
  };
  console.log(JSON.stringify(prof), JSON.stringify(out));
  if (!out.junit) { const a = renderJunitReport(full, { packs: ps, includeNotApplicable: true }).split('\n'), b = renderJunitReport(comp, { packs: ps, includeNotApplicable: true }).split('\n'); const i = a.findIndex((l, k) => l !== b[k]); console.log('  junit first diff:\n   ', a[i] && a[i].slice(0, 200), '\n   ', b[i] && b[i].slice(0, 200)); }
}
