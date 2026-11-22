const B = require('./bh.js');
const frame = `<!doctype html><html lang="en"><head><title>f</title><script src="/core.js"></script><script>CORE.a11yCoreEnableFrameResponder()</script></head><body><main><h1>f</h1><img src="x.png"></main></body></html>`;
const top = `<!doctype html><html lang="en"><head><title>top</title><script src="/core.js"></script></head><body><main><h1>t</h1><iframe src="/f0.html" title="f0"></iframe></main></body></html>`;
(async () => {
  await B.start(); B.pages({ '/f0.html': frame });
  const { page, logs } = await B.open('/', top);
  const r = await page.evaluate(async () => {
    const slow = { id: 'org-slow', meta: { title: 'slow', tags: ['wcag2a', 'wcag111'], wcagSc: ['1.1.1'] }, runInPage: "function (ctx) { var t = Date.now(); while (Date.now() - t < 400); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }" };
    const r = await CORE.runa11yCoreAcrossFrames(null, null, { timeBudgetMs: 300, customRules: [slow], profile: ['wcag22-aa', 'wcag21-aa'] }, null);
    const f = r.frames[0].topFrame; const t = r.topFrame;
    return { top: { inc: t.engine.incomplete, pnr: t.engine.profilesNotRun, profiles: t.engine.profiles }, frame: { inc: f.engine.incomplete, pnr: f.engine.profilesNotRun, profiles: f.engine.profiles, profile: f.engine.profile, notRunProfiles: [...new Set(f.notRun.map(n => n.profile))], rulesResults: f.rulesResults.length, prof: f.profiles && Object.keys(f.profiles) } };
  });
  console.log(JSON.stringify(r, null, 1)); console.log(logs.filter(l => l.startsWith('w')).map(l => l.slice(0, 220)));
  await B.stop();
})();
