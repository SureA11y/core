const B = require('./bh.js');
const frame = (n) => `<!doctype html><html lang="en"><head><title>f${n}</title><script src="/core.js"></script><script>CORE.a11yCoreEnableFrameResponder()</script></head><body><main><h1>f</h1><img src="x.png"></main></body></html>`;
const top = (k) => `<!doctype html><html lang="en"><head><title>top</title><script src="/core.js"></script></head><body><main><h1>t</h1>${Array.from({ length: k }, (_, i) => `<iframe src="/f${i}.html" title="f${i}"></iframe>`).join('')}</main></body></html>`;
(async () => {
  await B.start();
  B.pages({ '/f0.html': frame(0), '/f1.html': frame(1), '/f2.html': frame(2) });
  const { page, logs } = await B.open('/', top(3));
  const out = await page.evaluate(async () => {
    const slow = { id: 'org-slow', meta: { title: 'slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] },
      runInPage: "function (ctx) { var t = Date.now(); while (Date.now() - t < 400); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }" };
    const res = {};
    for (const [name, eo] of [['b900', { timeBudgetMs: 900, customRules: [slow] }], ['b900mp', { timeBudgetMs: 900, customRules: [slow], profile: ['wcag22-aa', 'wcag21-aa'] }], ['b100cap', { timeBudgetMs: 100, output: { maxOccurrencesPerRule: 1 } }]]) {
      const t0 = performance.now();
      const r = await CORE.runa11yCoreAcrossFrames(null, null, eo, null);
      const ms = Math.round(performance.now() - t0);
      const fr = (x) => x.error ? x.error : { inc: x.topFrame.engine.incomplete, notRun: (x.topFrame.notRun || []).length, ran: x.topFrame.checksResults.length };
      res[name] = { ms, top: fr(r), frames: r.frames.map(fr) };
      let tbl = null; try { tbl = typeof CORE.table === 'function' ? CORE.table(r) : 'no table fn'; } catch (e) { tbl = 'ERR ' + e.message; }
      res[name].table = Array.isArray(tbl) ? tbl.filter(x => JSON.stringify(x).includes('notRun')).length : String(tbl).slice(0, 200);
      try { const flat = CORE.flattenCrossFrameResult ? CORE.flattenCrossFrameResult(r) : null; res[name].flat = flat && { inc: flat.engine.incomplete, notRun: (flat.notRun || []).length }; } catch (e) { res[name].flat = 'ERR ' + e.message; }
    }
    res.keys = Object.keys(CORE).join(' ');
    return res;
  });
  console.log(JSON.stringify(out, null, 1).slice(0, 5000)); console.log(logs.slice(0, 10));
  await B.stop();
})();
