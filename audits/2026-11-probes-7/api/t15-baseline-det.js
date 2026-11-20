const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const B = require('/home/user/core/src/baseline.js');
const { renderSarifReport } = require('/home/user/core/src/sarif.js');
const { renderJunitReport } = require('/home/user/core/src/junit.js');
const { renderEarlReport } = require('/home/user/core/src/earl.js');
const html = require('./page.js') + '<div id="host"></div><script></script>';
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const tick = () => new Promise(r => setImmediate(r));
const norm = (s) => s.replace(/"(time|durationMs|elapsedMs|startedAt|finishedAt|timestamp|generatedAt|endTimeUtc|startTimeUtc|date)":\s*("[^"]*"|[\d.]+)/g, '"$1":0').replace(/time="[\d.]+"|timestamp="[^"]*"/g, '');
(async () => {
  const opts = { engineOptions: { profile: ['wcag22-aa', 'sample-1.0'], packs: [sample] } };
  const r1 = await runa11yCoreOnHtml(html, opts); await tick();
  const r2 = await runa11yCoreOnHtml(html, opts); await tick();
  const strip = (r) => { const c = JSON.parse(JSON.stringify(r)); delete c.perfStats; delete c.timestamp; delete c.durationMs; if (c.engine) delete c.engine.environment; return norm(JSON.stringify(c)); };
  const a = strip(r1), b = strip(r2);
  if (a !== b) { let i = 0; while (a[i] === b[i]) i++; console.log('RESULT DIFF at', i, a.slice(i - 150, i + 100), '\n VS', b.slice(i - 10, i + 100)); } else console.log('results identical');
  for (const [n, f] of [['sarif', renderSarifReport], ['junit', renderJunitReport], ['earl', (r) => JSON.stringify(renderEarlReport(r))]]) {
    const x = norm(f(r1)), y = norm(f(r2)); console.log(n, x === y ? 'same' : 'DIFF');
    if (x !== y) { let i = 0; while (x[i] === y[i]) i++; console.log('  ', x.slice(i - 80, i + 80), '\n VS', y.slice(i - 10, i + 80)); }
  }
  for (const leanFail of [false, true]) {
    const e = JSON.parse(JSON.stringify(B.buildBaselineEntries(r1, { leanFail })));
    const m = B.matchBaseline(r2, e, { leanFail });
    console.log('baseline leanFail', leanFail, 'entries', e.length, 'new', m.newCount, 'stale', m.staleCount, m.leanFail ? JSON.stringify({ n: m.leanFail.newCount, s: m.leanFail.staleCount }) : '');
    const mig = B.migrateBaselineEntries(e); const m2 = B.matchBaseline(r2, mig, { leanFail }); console.log('  migrated new', m2.newCount, 'stale', m2.staleCount);
    const file = { version: 1, generatedAt: new Date().toISOString(), entries: e }; const m3 = B.matchBaseline(r2, file, { leanFail }); console.log('  file new', m3.newCount);
    const s = JSON.parse(renderSarifReport(r2, { baselineEntries: e })); console.log('  sarif baselineState', [...new Set(s.runs[0].results.map(x => x.baselineState))]);
  }
})();
