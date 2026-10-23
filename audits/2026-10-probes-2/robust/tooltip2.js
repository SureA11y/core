const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const html = fs.readFileSync('tooltip.js','utf8').match(/const html = `([\s\S]*?)`;/)[1];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.__a=a11ycore;');
  const out = await p.evaluate(() => {
    const log = [];
    document.addEventListener('focusin', e => log.push('in:' + e.target.tagName + ':' + document.querySelectorAll('.tooltip').length), true);
    const r = window.__a.runa11yCoreInPage(location.href, null, {}, null);
    return { log, tips: document.querySelectorAll('.tooltip').length, order: r.checksResults.map(c => c.ruleId).join(',') };
  });
  console.log(out.log, out.tips);
  await new Promise(r => setTimeout(r, 1000));
  console.log('after 1s', await p.evaluate(() => document.querySelectorAll('.tooltip').length));
  await b.close();
})();
