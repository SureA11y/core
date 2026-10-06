const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const page = (p, n) => `<!doctype html><html lang="en"><head><title>Clobber test</title></head><body><main><h1>Form</h1>
<form id="f1" aria-label="Sign up" title="Sign up form"><input name="${p}${n}" type="text"><label for="ok">Ok</label><input id="ok"><button></button><img src="x.png"></form></main></body></html>`;
async function run(b, html) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.route('https://example.test/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.__a=a11ycore;');
  const t = Date.now();
  const res = await Promise.race([
    p.evaluate(() => { try { const r = window.__a.runa11yCoreInPage(location.href, null, {}, null); return JSON.stringify(r.checksResults.map(c => [c.ruleId, c.outcome, c.occurrences.length, c.error || ''])); } catch (e) { return JSON.stringify({ err: String(e.stack) }); } }),
    new Promise(r => setTimeout(() => r('TIMEOUT'), 20000))]);
  await ctx.close().catch(() => {});
  return { res, ms: Date.now() - t };
}
(async () => {
  const names = process.argv.slice(2);
  for (const n of names) {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const a = await run(b, page('z', n)); const c = await run(b, page('', n));
    if (c.res === 'TIMEOUT') { console.log(n, 'HANG'); await b.close().catch(()=>{}); continue; }
    const A = JSON.parse(a.res), C = JSON.parse(c.res);
    if (C.err) { console.log(n, 'THROW', C.err.slice(0, 300)); await b.close(); continue; }
    const ma = Object.fromEntries(A.map(x => [x[0], x.slice(1).join(':')]));
    const d = C.filter(x => ma[x[0]] !== x.slice(1).join(':')).map(x => x[0] + ' ' + ma[x[0]] + '->' + x.slice(1).join(':'));
    console.log(n, c.ms + 'ms', d.join(' ; ').slice(0, 600));
    await b.close();
  }
})();
