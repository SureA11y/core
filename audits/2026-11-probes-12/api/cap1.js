const H = require('./h.js');
const html = H.page('<img src="a.png">'.repeat(5) + '<div role="button">x</div>'.repeat(3) + '<table><tr><td>a</td><td>1</td></tr><tr><td>b</td><td>2</td></tr></table>'.repeat(3));
for (const v of [1.5, '2', 0, -1, 1e9, Infinity, 2 ** 53, true, null]) {
  for (const strict of [false, true]) { const { r, logs, err } = H.scan(html, { strictOptions: strict, output: { maxOccurrencesPerRule: v } }, ['img-alt-present']); console.log('cap', String(v), strict ? 'S' : '-', err ? 'ERR ' + err.code : (r.checksResults[0].occurrences.length + ' omitted=' + r.checksResults[0].occurrencesOmitted + ' cap=' + JSON.stringify(r.engine.occurrenceCap)), logs.map(l => l.slice(0, 120))); }
}
// multi-profile + cap
const mp = H.scan(html, { profile: ['wcag21-aa', 'wcag22-aa'], output: { maxOccurrencesPerRule: 1 } }).r;
const im = mp.checksResults.filter(c => c.ruleId === 'img-alt-present'); console.log('mp checks for img', im.length, im.map(c => [c.profile, c.occurrences.length, c.occurrencesOmitted]));
console.log('mp occurrenceCap', JSON.stringify(mp.engine.occurrenceCap));
const mb = H.baseline.matchBaseline(mp, H.baseline.buildBaselineEntries(H.scan(html, { profile: ['wcag21-aa', 'wcag22-aa'] }).r));
console.log('mp capped vs full baseline', mb.newCount, mb.totalFail, JSON.stringify(mb.incomplete));
// compact + cap
const cp = H.scan(html, { output: { maxOccurrencesPerRule: 1, detail: 'findings' } }).r; const ci = cp.checksResults.find(c => c.ruleId === 'img-alt-present'); console.log('compact', ci.occurrences.length, ci.occurrencesOmitted, JSON.stringify(ci.occurrencesOmittedByOutcome));
// cap + exclude
const ce = H.scan(html, { excludeSelectors: ['img:nth-of-type(1)', 'img:nth-of-type(2)'], output: { maxOccurrencesPerRule: 1 } }, ['img-alt-present']).r.checksResults[0]; console.log('cap+exclude', ce.occurrences.length, ce.occurrencesOmitted, JSON.stringify(ce.excludedOccurrences));
