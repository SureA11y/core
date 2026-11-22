const H = require('./h.js');
for (const n of [500, 2000, 4000]) {
  const html = H.page(Array.from({ length: n }, (_, i) => `<img src="i${i}.png">`).join(''));
  let t = Date.now(); const { r } = H.scan(html, {}, ['img-alt-present']); const ts = Date.now() - t;
  t = Date.now(); const { r: rc } = H.scan(html, { output: { maxOccurrencesPerRule: 20 } }, ['img-alt-present']); const tc = Date.now() - t;
  const size = JSON.stringify(r).length, sizec = JSON.stringify(rc).length;
  t = Date.now(); const be = H.quiet(() => H.baseline.buildBaselineEntries(r)).r; const tb = Date.now() - t;
  t = Date.now(); const m = H.baseline.matchBaseline(r, be); const tm = Date.now() - t;
  t = Date.now(); H.sarif.renderSarifReport(r); const tsar = Date.now() - t;
  t = Date.now(); H.junit.renderJunitReport(r); const tj = Date.now() - t;
  t = Date.now(); const hr = H.report.renderHtmlReport(r); const th = Date.now() - t;
  t = Date.now(); H.earl.renderEarlReport(r); const te = Date.now() - t;
  t = Date.now(); const hc = H.report.renderHtmlReport(rc); const thc = Date.now() - t;
  console.log(`n=${n} scan=${ts} capScan=${tc} size=${(size / 1e6).toFixed(2)}MB capSize=${(sizec / 1e3).toFixed(0)}KB build=${tb} match=${tm} new=${m.newCount} sarif=${tsar} junit=${tj} html=${th}(${(hr.length / 1e6).toFixed(1)}MB) earl=${te} htmlCap=${thc}(${(hc.length / 1e3).toFixed(0)}KB)`);
}
