'use strict';
// A report of a clean scan fails table-th-has-data-cells on itself (WCAG 2.2 AA self-scan).
const L = require('./lib.js');
const fs = require('fs');
const { chromium } = require(L.C + '/node_modules/playwright');
const { runa11yCoreOnHtml } = require(L.C + '/src/testing.js');
const BUNDLE = fs.readFileSync(L.C + '/surea11y.browser.js', 'utf8');
const clean = runa11yCoreOnHtml('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>Hi</h1><img src="a.png" alt="A cat"></main></body></html>',
  { runOnly: { includeRuleIds: ['img-alt-present', 'page-title-present'] }, entryPointParity: false });
console.log('outcomes', clean.checksResults.map(c => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(L.renderHtmlReport(clean));
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => (d.open = true)));
  await page.addScriptTag({ content: BUNDLE });
  console.log(await page.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, {}, { wcag: { version: '2.2', level: 'AA' } })
    .checksResults.filter(c => c.outcome === 'fail').map(c => c.ruleId + ' x' + c.occurrences.length + ' ' + c.meta.normativeMappings.filter(m => m.standard === 'WCAG' && !m.type).map(m => m.requirement))));
  await browser.close();
})();
