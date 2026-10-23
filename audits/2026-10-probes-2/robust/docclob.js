const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const page = (n) => `<!doctype html><html lang="en"><head><title>Doc clobber</title></head><body><main><h1>Doc</h1>
<img name="${n}" src="x.png"><form aria-label="s"><label for="ok">Ok</label><input id="ok"><button></button></form><a href="/x">click here</a><div id="d" aria-labelledby="zz">x</div></main></body></html>`;
async function run(b, html) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  await p.route('https://example.test/**', r => r.request().url()==='https://example.test/' ? r.fulfill({ status: 200, contentType: 'text/html', body: html }) : r.fulfill({status:404, body:''}));
  await p.goto('https://example.test/');
  await p.evaluate(bundle + ';window.__a=a11ycore;');
  const res = await Promise.race([
    p.evaluate(() => { try { const r = window.__a.runa11yCoreInPage(location.href, null, {}, null); return JSON.stringify(r.checksResults.map(c => [c.ruleId, c.outcome, c.occurrences.length, c.error || ''])); } catch (e) { return JSON.stringify({ err: String(e.stack) }); } }),
    new Promise(r => setTimeout(() => r('TIMEOUT'), 20000))]);
  await ctx.close().catch(() => {});
  return res;
}
(async () => {
  const b0 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const A = JSON.parse(await run(b0, page('zzz'))); await b0.close();
  const ma = Object.fromEntries(A.map(x => [x[0], x.slice(1).join(':')]));
  for (const n of process.argv.slice(2)) {
    const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const c = await run(b, page(n));
    await b.close().catch(() => {});
    if (c === 'TIMEOUT') { console.log(n, 'HANG'); continue; }
    const C = JSON.parse(c);
    if (C.err) { console.log(n, 'THROW', C.err.slice(0, 300)); continue; }
    const d = C.filter(x => ma[x[0]] !== x.slice(1).join(':')).map(x => x[0] + ' ' + ma[x[0]] + '->' + x.slice(1).join(':'));
    // expected: img-alt-present count stays same (the img is there in both)
    console.log(n, d.join(' ; ').slice(0, 700));
  }
})();
