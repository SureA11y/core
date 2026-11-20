'use strict';
// CPU-profile one rule on one generated page in Chromium; print top self-time functions with line numbers.
// node cpuprof.js <kind> <n> <ruleId>
const C = require('./chrome-lib.js');
const { kinds } = require('./perf-pages.js');
const [kind, n, rule] = [process.argv[2], +process.argv[3], process.argv[4]];
(async () => {
  const b = await C.launch();
  const p = await b.newPage();
  await p.setContent(kinds[kind](n));
  await C.inject(p);
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  const ms = await p.evaluate((rule) => { const t = performance.now(); window.a11ycore.runa11yCoreInPage(null, null, {}, { includeRuleIds: [rule] }); return performance.now() - t; }, rule);
  const { profile } = await cdp.send('Profiler.stop');
  const dt = {}; const byId = new Map(profile.nodes.map((nd) => [nd.id, nd]));
  const counts = {}; for (const s of profile.samples) counts[s] = (counts[s] || 0) + 1;
  const total = profile.samples.length;
  for (const [id, c] of Object.entries(counts)) {
    const nd = byId.get(+id); const f = nd.callFrame;
    const key = `${f.functionName || '(anon)'} @${f.url ? 'bundle' : ''}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
    dt[key] = (dt[key] || 0) + c;
  }
  console.log(kind, n, rule, 'ms', ms.toFixed(0));
  for (const [k, v] of Object.entries(dt).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(((100 * v) / total).toFixed(1) + '%', k);
  await b.close();
})();
