const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(require('./page.js'));
  await page.addScriptTag({ content: bundle });
  const out = await page.evaluate(async () => {
    const res = [];
    const cases = [undefined, null, [], 'x', { wcag: { version: '2.2', level: 'AA' } }, { bestPractices: true }, { includeRuleIds: ['img-alt-present'] }, { excludeRuleIds: ['img-alt-present'] }, { tags: { include: ['wcag2a'] } }, { runOnly: ['img-alt-present'], context: 'main' }, { context: '#nope' }, { context: '::bad(' }, { runOnly: ['nope-rule'] }, { profile: ['wcag22-aa', 'wcag21-a'] }, { strictOptions: true, lcoale: 'de' }, { runOnly: 'img-alt-present' }, { type: 'tag', values: ['wcag2a'] }];
    for (const c of cases) {
      try { const r = await window.a11ycore.run(c); res.push(JSON.stringify(c) + ' => OK n=' + r.checksResults.length + ' profile=' + r.engine.profile + ' profiles=' + JSON.stringify(r.engine.profiles)); }
      catch (e) { res.push(JSON.stringify(c) + ' => REJECT ' + (e.code || '') + ' ' + String(e.message).slice(0, 120)); }
    }
    return res;
  });
  console.log(out.join('\n'));
  await browser.close();
})();
