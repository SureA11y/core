const { chromium } = require('/home/user/core-r10/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const logs = []; page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 250)));
  await page.setContent('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><img src="a.png"></main></body></html>');
  await page.addScriptTag({ path: '/home/user/core-r10/surea11y.browser.js' });
  const out = await page.evaluate(() => {
    const slow = { id: 'org-slow', meta: { title: 'slow', tags: ['wcag2a','wcag111'], wcagSc: ['1.1.1'] },
      runInPage: "function (ctx) { var t = Date.now(); while (Date.now() - t < 800); return { ruleId: ctx.rule.ruleId, outcome: 'pass', severity: 'moderate', occurrences: [] }; }" };
    const r = window.a11ycore.runa11yCoreInPage(null, null, { profile: ['wcag21-aa', 'wcag22-aa'], timeBudgetMs: 700, customRules: [slow] }, null);
    const origTable = console.table; let rows = null; console.table = (x) => { rows = x; };
    window.a11ycore.table(r); console.table = origTable;
    return { incomplete: r.engine.incomplete, profilesNotRun: r.engine.profilesNotRun, notRun: r.notRun, rows: Array.isArray(rows) ? rows.filter(x => x.outcome === 'notRun' || /not run|profile/i.test(x.summary)) : rows };
  });
  console.log(JSON.stringify(out)); console.log(logs.filter(l => /surea11y/.test(l)).join('\n'));
  await browser.close();
})();
