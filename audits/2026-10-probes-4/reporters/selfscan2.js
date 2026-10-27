'use strict';
const L = require('./lib.js');
const fs = require('fs');
const { chromium } = require(L.C + '/node_modules/playwright');
const { runa11yCoreOnHtml } = require(L.C + '/src/testing.js');
const BUNDLE = fs.readFileSync(L.C + '/surea11y.browser.js', 'utf8');
const allPass = runa11yCoreOnHtml(fs.readFileSync(L.C + '/tests/fixtures/all-pass.html', 'utf8'), { entryPointParity: false });
const idx = JSON.parse(fs.readFileSync(__dirname + '/out/corpus.json', 'utf8'))['full:index.html'];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [name, r] of [['all-pass', allPass], ['index', idx]]) {
    const html = L.renderHtmlReport(r);
    const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
    await page.setContent(html);
    await page.evaluate(() => document.querySelectorAll('details').forEach(d => (d.open = true)));
    await page.addScriptTag({ content: BUNDLE });
    const res = await page.evaluate(() => {
      const r = window.a11ycore.runa11yCoreInPage(null, null, {}, { wcag: { version: '2.2', level: 'AA' } });
      const wide = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).filter(e => !(e.parentElement && e.parentElement.getBoundingClientRect().right > window.innerWidth + 1)).map(e => e.tagName + '.' + e.className + '#' + e.id + ' right=' + Math.round(e.getBoundingClientRect().right));
      return {
        rows: document.querySelectorAll('#findings-body tr').length,
        fail: r.checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId),
        ct: r.checksResults.filter(c => c.outcome === 'cantTell').map(c => c.ruleId + ': ' + c.occurrences.slice(0, 6).map(o => o.selector + ' | ' + (o.summary || '').slice(0, 90)).join(' ;; ')),
        wide: wide.slice(0, 10), scrollW: document.documentElement.scrollWidth,
      };
    });
    console.log(name, JSON.stringify(res, null, 1));
    await page.close();
  }
  await browser.close();
})();
