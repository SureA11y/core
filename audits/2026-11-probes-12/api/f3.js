const H = require('./h.js'); const r = require('./xf.json');
console.log('frames', r.frames.map(f => f.topFrame && [!!f.topFrame.engine.incomplete, f.topFrame.notRun.length]));
const W = console.warn; console.warn = (...a) => console.log('WARN', String(a[0]).slice(0, 200));
for (const [n, fn] of [['sarif', () => { const s = JSON.parse(H.sarif.renderSarifReport(r)); return s.runs.map(x => [x.invocations && x.invocations[0].executionSuccessful, (x.invocations[0].toolExecutionNotifications || []).length]); }],
  ['junit', () => (H.junit.renderJunitReport(r).match(/<testsuites[^>]*>/) || [])[0]],
  ['earl', () => (JSON.stringify(H.earl.renderEarlReport(r)).match(/earl:untested/g) || []).length],
  ['html', () => (H.report.renderHtmlReport(r).match(/Incomplete scan[^<]{0,120}/g) || []).length],
  ['baseline', () => { const m = H.baseline.matchBaseline(r, H.baseline.buildBaselineEntries(r)); return JSON.stringify(m.incomplete).slice(0, 200) + ' new=' + m.newCount; }]]) {
  try { console.log(n, JSON.stringify(fn())); } catch (e) { console.log(n, 'ERR', e.message.slice(0, 300)); }
}
