// Full scan of a page in jsdom and Chromium; prints rules whose outcome or finding count differ, and DOM changes from the scan.
const fs = require('fs');
const CORE='/home/user/core-r11';
const { chromium } = require(CORE+'/node_modules/playwright');
const { runa11yCoreOnHtml } = require(CORE+'/src/testing.js');
(async () => {
  const files = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    let jr; try { jr = runa11yCoreOnHtml(html, { entryPointParity: false }); } catch (e) { console.log(f, 'JSDOM THROW', e.message); continue; }
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.setContent(html, { waitUntil: 'load' });
    const snap = () => page.evaluate(() => document.documentElement.outerHTML + '|' + (document.activeElement && document.activeElement.outerHTML.slice(0,80)) + '|' + scrollX + ',' + scrollY);
    const before = await snap();
    await page.addScriptTag({ path: CORE+'/surea11y.browser.js' });
    const cr = await page.evaluate(() => JSON.parse(JSON.stringify(window.a11ycore.runa11yCoreInPage(null, null, {}, null))));
    const after = (await snap()).replace(/<script src="[^"]*"><\/script>|<script>[\s\S]*?a11ycore[\s\S]*?<\/script>/, '');
    if (before !== after) { const a=before, b=after; let i=0; while (a[i]===b[i]) i++; console.log(f, 'PAGE CHANGED at', i, JSON.stringify(a.slice(i-60,i+120)), '=>', JSON.stringify(b.slice(i-60,i+120))); }
    const J = new Map(jr.checksResults.map(c => [c.ruleId, c]));
    console.log('== ' + f);
    for (const c of cr.checksResults) {
      const j = J.get(c.ruleId); if (!j) { console.log('  only chrome', c.ruleId); continue; }
      const sig = x => x.outcome + '/' + (x.occurrences||[]).length;
      if (c.outcome === 'error' || j.outcome === 'error') console.log('  ERROR', c.ruleId, JSON.stringify(c.error||j.error||'').slice(0,200));
      if (sig(c) !== sig(j)) console.log('  ' + c.ruleId.padEnd(42) + ' jsdom ' + sig(j).padEnd(16) + ' chrome ' + sig(c));
    }
    fs.writeFileSync(f + '.cr.json', JSON.stringify(cr)); fs.writeFileSync(f + '.js.json', JSON.stringify(jr));
    await page.close();
  }
  await browser.close();
})();
