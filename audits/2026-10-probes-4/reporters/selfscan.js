'use strict';
const L = require('./lib.js');
const fs = require('fs');
const { chromium } = require(L.C + '/node_modules/playwright');
const { evilResult, evilCrossFrame } = require('./evil.js');
const BUNDLE = fs.readFileSync(L.C + '/surea11y.browser.js', 'utf8');
const corpus = JSON.parse(fs.readFileSync(__dirname + '/out/corpus.json', 'utf8'));
const pick = (k) => corpus[k];
const cases = {
  'full:index': pick('full:index.html'),
  'de:index': pick('de:index.html'),
  'ja:index(compact)': pick('ja:index.html'),
  'pack:index': pick('pack:index.html'),
  'ids:index(partly)': pick('ids:index.html'),
  'custom:img': pick('custom:img-alt-present-all-scenarios.html'),
  'en:contrast': pick('en:contrast-all-scenarios.html'),
  'crossframe': { topFrame: pick('full:index.html'), frames: [{ url: 'https://f.test/', selector: '#pay', title: 'Pay', topFrame: pick('full:img-alt-present-all-scenarios.html'), frames: [] }, { url: 'https://ads.test/', selector: '#ads', title: null, error: 'timeout' }] },
  'evil': evilResult(),
  'empty': { checksResults: [] },
};
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [name, r] of Object.entries(cases)) {
    if (!r) { console.log('missing', name); continue; }
    const html = L.renderHtmlReport(JSON.parse(JSON.stringify(r)));
    for (const [colorScheme, width] of [['light', 1280], ['dark', 1280], ['light', 320]]) {
      const page = await browser.newPage({ colorScheme, viewport: { width, height: 900 } });
      await page.setContent(html);
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => (d.open = true)));
      await page.addScriptTag({ content: BUNDLE });
      const res = await page.evaluate(() => {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, { wcag: { version: '2.2', level: 'AA' } });
        return {
          fail: r.checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId + ': ' + c.occurrences.filter(o => o.occurrenceOutcome !== 'cantTell').slice(0, 3).map(o => o.selector + ' | ' + (o.summary || '').slice(0, 120)).join(' ;; ')),
          cantTell: r.checksResults.filter(c => c.outcome === 'cantTell').map(c => c.ruleId + '(' + c.occurrences.length + ')'),
          hscroll: document.documentElement.scrollWidth > window.innerWidth ? document.documentElement.scrollWidth : 0,
        };
      });
      console.log(`${name} [${colorScheme} ${width}] fail=${JSON.stringify(res.fail)} hscroll=${res.hscroll}`);
      if (colorScheme === 'light' && width === 1280) console.log('   cantTell:', res.cantTell.join(', '));
      await page.close();
    }
  }
  await browser.close();
})();
