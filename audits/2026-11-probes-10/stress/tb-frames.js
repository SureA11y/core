// Each frame gets the whole timeBudgetMs in runa11yCoreAcrossFrames
const { chromium } = require('/home/user/core-r10/node_modules/playwright');
const http = require('http'); const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core-iife.js');
const frame = `<!doctype html><html lang="en"><head><title>f</title><script src="/core.js"></script><script>CORE.a11yCoreEnableFrameResponder()</script></head><body><p>frame</p></body></html>`;
const top = `<!doctype html><html lang="en"><head><title>top</title><script src="/core.js"></script></head><body><main><h1>t</h1>${'<iframe src="/f.html" title="f"></iframe>'.repeat(3)}</main></body></html>`;
const srv = http.createServer((q, s) => { if (q.url === '/core.js') { s.setHeader('content-type','text/javascript'); return s.end(core); } s.setHeader('content-type','text/html'); s.end(q.url === '/f.html' ? frame : top); }).listen(0, async () => {
  const port = srv.address().port;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  const out = await page.evaluate(async () => {
    const slow = { id: 'org-slow', meta: { title: 'slow', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'] },
      runInPage: "function (ctx) { var t = Date.now(); while (Date.now() - t < 600); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }" };
    const t0 = performance.now();
    const r = await CORE.runa11yCoreAcrossFrames(null, null, { timeBudgetMs: 500, customRules: [slow], frameWaitTime: 60000 }, null);
    const ms = Math.round(performance.now() - t0);
    return { ms, top: { incomplete: r.topFrame.engine.incomplete, notRun: (r.topFrame.notRun||[]).length }, frames: r.frames.map(f => f.error ? f.error : ({ incomplete: f.topFrame.engine.incomplete, notRun: (f.topFrame.notRun||[]).length, slow: (f.topFrame.checksResults.find(c=>c.ruleId==='org-slow')||{}).outcome })) };
  });
  console.log(JSON.stringify(out, null, 1));
  await browser.close(); srv.close();
});
