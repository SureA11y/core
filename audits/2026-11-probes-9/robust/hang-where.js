'use strict';
// Where does a scan spin when the page's Array.prototype.pop (or shift) returns undefined
// without removing anything? Pauses the page after 8 s and prints the stack.
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const which = process.argv[2] || 'pop';
const html = fs.readFileSync(__dirname + '/combined.html', 'utf8');
(async () => {
  const s = await serve({ '/c': { body: html }, '/small': { body: '<!doctype html><html lang=en><title>t</title><main><h1>h</h1><p>Hello <a href=#>x</a></p><button>b</button></main>' } });
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(s.base + (process.argv[3] || '/small'));
  await page.evaluate((w) => { Array.prototype[w] = function () { return undefined; }; }, which);
  await addBundle(page, s.base);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Debugger.enable');
  const bundle = fs.readFileSync('/home/user/core-r9/surea11y.browser.js', 'utf8').split('\n');
  let scripts = {};
  cdp.on('Debugger.scriptParsed', (e) => { scripts[e.scriptId] = e.url; });
  const done = page.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 'finished'; }).catch((e) => 'err ' + e.message.slice(0, 100));
  const r = await Promise.race([done, new Promise((res) => setTimeout(() => res(null), 8000))]);
  if (r) { console.log(which, 'scan', r); await browser.close(); s.close(); return; }
  const paused = new Promise((res) => cdp.once('Debugger.paused', res));
  await cdp.send('Debugger.pause');
  const ev = await paused;
  console.log(which, 'still running after 8s; stack:');
  for (const f of ev.callFrames.slice(0, 8)) {
    const l = f.location;
    const src = (scripts[l.scriptId] || '').includes('surea11y') ? bundle[l.lineNumber].slice(Math.max(0, l.columnNumber - 120), l.columnNumber + 80) : '';
    console.log('  ', f.functionName || '(anon)', l.lineNumber + ':' + l.columnNumber, '\n      ', src);
  }
  await browser.close();
  s.close();
  process.exit(0);
})();
