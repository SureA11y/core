const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const L = require('./lib');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.setContent(L.PAGE);
  await page.evaluate(fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8'));
  const cases = [
    [{ includeRuleIds: ['contrast-computable', 'LINK-NAME-PRESENT'] }, { wcagVersion: '2.2', wcagLevel: 'aa' }],
    [{ includeRuleIds: ['duplicate-id'] }, { wcagVersion: '2.1' }],
    [{ bestPractices: true }, {}],
    [{ tags: ['wcag244'] }, {}],
    [null, { profile: 'wcag22-aa', wcagLevel: 'A' }],
  ];
  for (const [ro, eo] of cases) {
    const b = await page.evaluate(([ro, eo]) => { const r = a11ycore.runa11yCoreInPage(null, null, eo, ro); return Promise.resolve(r).then((r) => ({ ids: r.rulesResults.map((x) => x.ruleId + ':' + x.outcome), lvl: r.engine.wcagLevel })); }, [ro, eo]);
    const n = L.scan(ro, eo).value;
    const nids = n.rulesResults.map((x) => x.ruleId + ':' + x.outcome);
    console.log(JSON.stringify(ro), JSON.stringify(eo), 'browser', b.ids.length, b.lvl, 'node', nids.length, n.engine.wcagLevel, 'sameIds', JSON.stringify(b.ids.map(x=>x.split(':')[0])) === JSON.stringify(nids.map(x=>x.split(':')[0])));
    if (b.ids.length < 6) console.log('   ', b.ids.join(' '), '|', nids.join(' '));
  }
  await browser.close();
})();
