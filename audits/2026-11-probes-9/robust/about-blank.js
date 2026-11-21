'use strict';
// Scan about:blank and a page whose content is only text, in Chromium.
const fs = require('fs');
const { launch } = require('./lib');
(async () => {
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ content: fs.readFileSync('/home/user/core-r9/surea11y.browser.js', 'utf8') });
  const r = await page.evaluate(() => { try { const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null); return r.checksResults.filter((c) => c.error || !['notApplicable', 'pass'].includes(c.outcome)).map((c) => c.ruleId + '=' + c.outcome + (c.error ? ' ERR ' + c.error : '')).join(' | '); } catch (e) { return 'THROW ' + e.message; } });
  console.log('about:blank:', r);
  await browser.close();
})();
