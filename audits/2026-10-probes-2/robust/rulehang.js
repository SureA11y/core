const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const n = process.argv[2] || 'parentNode';
const html = process.env.HTML || `<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>F</h1><form aria-label="s"><input name="${n}"></form></main></body></html>`;
(async () => {
  let b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let p = await b.newPage();
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const ids = await p.evaluate(() => { const r = a11ycore.runa11yCoreInPage(location.href, '#nomatch', {}, null); return r.checksResults.map(c => c.ruleId); });
  for (const id of ids) {
    const res = await Promise.race([p.evaluate((id) => { const r = a11ycore.runa11yCoreInPage(location.href, null, {}, [id]); return r.checksResults.map(c => c.outcome + (c.error ? '!' + c.error : '')).join(','); }, id), new Promise(r => setTimeout(() => r('HANG'), 8000))]);
    if (res === 'HANG') {
      console.log(id, 'HANG');
      await b.close().catch(() => {}); b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); p = await b.newPage();
      await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
      await p.goto('https://example.test/'); await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
    }
  }
  console.log('done', ids.length);
  await b.close();
})();
