const B = require('./bh.js'); const fs = require('fs');
const frame = (n) => `<!doctype html><html lang="en"><head><title>f${n}</title><script src="/core.js"></script><script>CORE.a11yCoreEnableFrameResponder()</script></head><body><main><h1>f</h1><img src="x.png"></main></body></html>`;
const top = `<!doctype html><html lang="en"><head><title>top</title><script src="/core.js"></script></head><body><main><h1>t</h1><img src="y.png"><iframe src="/f0.html" title="f0"></iframe><iframe src="/f1.html" title="f1"></iframe></main></body></html>`;
(async () => {
  await B.start(); B.pages({ '/f0.html': frame(0), '/f1.html': frame(1) });
  const { page } = await B.open('/', top);
  const r = await page.evaluate(async () => {
    const slow = { id: 'org-slow', meta: { title: 'slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: "function (ctx) { var t = Date.now(); while (Date.now() - t < 400); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }" };
    return CORE.runa11yCoreAcrossFrames(null, null, { timeBudgetMs: 600, customRules: [slow], output: { maxOccurrencesPerRule: 1 } }, null);
  });
  fs.writeFileSync(__dirname + '/xf.json', JSON.stringify(r)); await B.stop();
})();
