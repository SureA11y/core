const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const n = process.argv[2] || 'parentNode';
const html = process.env.HTML || `<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>F</h1><form aria-label="s"><input name="${n}"></form></main></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  p.on('console', m => console.log('console:', m.text()));
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const mode = process.argv[3] || 'null';
  const res = await Promise.race([p.evaluate((mode) => {
    const t = performance.now();
    const ids = a11ycore.runa11yCoreInPage(location.href, '#nomatch', {}, null).checksResults.map(c => c.ruleId);
    const ro = mode === 'null' ? null : mode === 'all' ? ids : mode.split(',');
    const r = a11ycore.runa11yCoreInPage(location.href, null, {engineOptions:{}}, ro);
    return Math.round(performance.now() - t) + 'ms ' + r.checksResults.filter(c=>c.error).map(c=>c.ruleId+'!'+c.error).join(';');
  }, mode), new Promise(r => setTimeout(() => r('HANG'), 15000))]);
  console.log(mode, res);
  process.exit(0);
})();
