const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const n = process.argv[2] || 'parentNode';
const html = process.env.HTML || `<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>F</h1><form aria-label="s"><input name="${n}"></form></main></body></html>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage(); console.log('page');
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/'); console.log('nav');
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;'); console.log('loaded');
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Debugger.enable');
  const paused = new Promise(r => cdp.once('Debugger.paused', r));
  p.evaluate((ro) => { window.__r = a11ycore.runa11yCoreInPage(location.href, null, {}, ro); }, process.env.RULE ? [process.env.RULE] : null).catch(() => {});
  await new Promise(r => setTimeout(r, 6000));
  console.log('pausing'); await cdp.send('Debugger.pause'); console.log('sent');
  const ev = await paused;
  const src = {};
  for (const f of ev.callFrames.slice(0, 12)) {
    const sid = f.location.scriptId;
    if (!src[sid]) src[sid] = (await cdp.send('Debugger.getScriptSource', { scriptId: sid })).scriptSource.split('\n');
    const line = src[sid][f.location.lineNumber] || '';
    console.log(f.functionName || '(anon)', f.location.lineNumber + ':' + f.location.columnNumber, line.slice(Math.max(0, f.location.columnNumber - 120), f.location.columnNumber + 80));
  }
  process.exit(0);
})();
