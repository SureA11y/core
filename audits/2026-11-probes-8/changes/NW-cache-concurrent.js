// Two scans started together in one page (Promise.all): does the first one's cleanup break the second? Results equal to a lone scan?
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await b.newPage();
  await page.setContent(require('/tmp/surea11y-audit/r7/api/page.js'));
  await page.evaluate(fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8'));
  const out = await page.evaluate(async () => {
    const sig = (r) => r.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length + (c.error ? ':ERR ' + c.error : '')).join('\n');
    const lone = sig(await window.a11ycore.runa11yCoreInPage(null, null, {}, null));
    const [a, b] = await Promise.all([window.a11ycore.runa11yCoreInPage(null, null, {}, null), window.a11ycore.runa11yCoreInPage(null, null, {}, null)]);
    const diff = (x) => x.split('\n').filter((l, i) => l !== lone.split('\n')[i]);
    return { a: diff(sig(a)), b: diff(sig(b)), left: !!window.__a11ycoreSharedCache };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
