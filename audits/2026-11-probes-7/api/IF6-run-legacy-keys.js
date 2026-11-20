// a11ycore.run() refuses selection keys outside runOnly (INTEGRATION.md), but not the legacy
// tag form's keys (type/values) nor includeMode or a tag list in `tags`: those run every rule, silently.
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const warnings = []; page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text().slice(0, 140)); });
  await page.setContent('<html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>');
  await page.addScriptTag({ content: bundle });
  const out = await page.evaluate(async () => {
    const res = [];
    for (const c of [{ runOnly: { type: 'tag', values: ['wcag2a'] } }, { type: 'tag', values: ['wcag2a'] }, { runOnly: ['wcag2a'] }, { tags: ['wcag2a'] }, { includeMode: 'only' }, { includeRuleIds: ['img-alt-present'] }]) {
      try { const r = await window.a11ycore.run(c); res.push(JSON.stringify(c) + ' => ran ' + r.checksResults.length + ' rules'); }
      catch (e) { res.push(JSON.stringify(c) + ' => rejected: ' + String(e.message).slice(0, 90)); }
    }
    return res;
  });
  console.log(out.join('\n')); console.log('warnings:', warnings);
  await browser.close();
})();
