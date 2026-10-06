const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(fs.readFileSync(process.argv[2], 'utf8'));
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const res = [];
  for (let i = 0; i < 30; i++) { res.push(await p.evaluate((ro) => { const c = a11ycore.runa11yCoreInPage(location.href, null, {}, ro).checksResults.find(c => c.ruleId === 'text-spacing-content-loss'); return c.outcome + (c.occurrences[0] ? ':' + c.occurrences.map(o => o.selector + ' ' + o.summary.slice(60, 120)).join(' | ') : ''); }, process.argv[3] ? process.argv[3].split(',') : null)); }
  console.log(res.join('\n'));
  await b.close();
})();
