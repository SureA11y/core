const H = require('./h.js');
const html = H.page('<img src="a.png"><img src="b.png"><div><img src="c.png"></div>');
const html2 = H.page('<p>new para</p><img src="a.png"><img src="b.png"><div><img src="c.png"></div><img src="d.png">');
const ro = ['img-alt-present'];
const A = H.scan(html, { output: { includeHtml: false } }, ro).r, A2 = H.scan(html2, { output: { includeHtml: false } }, ro).r;
const F = H.scan(html, {}, ro).r;
const eA = H.baseline.buildBaselineEntries(A); console.log('keys noHtml', JSON.stringify(H.baseline.entriesOf ? H.baseline.entriesOf(eA).map(e => e.key || e) : eA).slice(0, 500));
const m = H.baseline.matchBaseline(A2, eA); console.log('noHtml page2 vs baseline: new', m.newCount, 'known', m.knownCount, 'fixed', m.fixedCount, JSON.stringify(Object.keys(m)));
const eF = H.baseline.buildBaselineEntries(F); const m2 = H.baseline.matchBaseline(A, eF); console.log('html baseline vs noHtml scan: new', m2.newCount, 'fixed', m2.fixedCount);
const s = JSON.parse(H.sarif.renderSarifReport(A)); console.log('sarif fp', s.runs[0].results.map(x => JSON.stringify(x.partialFingerprints)).join(' '));
// selectors-off too
const N = H.scan(html, { output: { includeHtml: false, includeSelector: false } }, ro).r; const eN = H.baseline.buildBaselineEntries(N); console.log('no html no selector keys', JSON.stringify(eN).slice(0, 300));
const N2 = H.scan(html2, { output: { includeHtml: false, includeSelector: false } }, ro).r; const m3 = H.baseline.matchBaseline(N2, eN); console.log(' page2 new', m3.newCount);
