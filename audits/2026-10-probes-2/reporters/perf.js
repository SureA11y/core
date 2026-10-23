const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const { renderHtmlReport } = require('/home/user/core/src/report.js');
const { buildBaselineEntries, matchBaseline, computeBaselineKey } = require('/home/user/core/src/baseline.js');
const base = require('./result.en.json');
for (const N of [2000, 8000, 32000]) {
  const r = JSON.parse(JSON.stringify(base));
  const f = r.checksResults.find(c => c.ruleId === 'button-name-present');
  const occ = f.occurrences[0];
  f.occurrences = Array.from({ length: N }, (_, i) => ({ ...occ, html: `<button class="c${i % 7} b a" id="x${i}" data-z="1" aria-x="${'y'.repeat(50)}"></button>`, selector: `#x${i}` }));
  const bl = buildBaselineEntries(r);
  const t = (name, fn) => { const s = Date.now(); const out = fn(); console.log(N, name, Date.now() - s, 'ms', typeof out === 'string' ? out.length : ''); };
  t('sarif', () => renderSarifReport(r, { baselineEntries: bl.slice(0, N / 2) }));
  t('junit', () => renderJunitReport(r, { baselineEntries: bl.slice(0, N / 2) }));
  t('earl', () => JSON.stringify(renderEarlReport(r)));
  t('html', () => renderHtmlReport(r));
  t('match', () => JSON.stringify(matchBaseline(r, bl)));
}
// pathological html for baseline key
for (const n of [1e4, 1e5, 4e5]) {
  for (const [name, s] of [['lt', '<'.repeat(n)], ['ltA', '<a'.repeat(n)], ['attrs', '<a ' + 'b '.repeat(n)], ['quote', '<a b="'.repeat(n)], ['eq', '<a b=c '.repeat(n)], ['nested', '<a x="'+'<'.repeat(n)]]) {
    const st = Date.now(); computeBaselineKey('r', 'D', s); const ms = Date.now() - st; if (ms > 50) console.log('key', name, n, ms, 'ms');
  }
}
