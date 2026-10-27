// Re-runs every repro in repros/: the engine in Chromium (twice) and in
// jsdom (twice), plus Chromium's role and name for each id.
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const { chromium } = req('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const jsdomRun = req('./jsdom-run.cjs');
const axNames = req('./axname.cjs');
const NOISE = /manual-review|page-title|target-size|contrast|landmark|region|bypass|scrollable|heading-quality|widget-keyboard|focus-order|form-control-programmatic-label-quality|img-alt-decorative|link-name-quality|keyboard/;
const files = (process.argv[2] ? [process.argv[2]] : fs.readdirSync('repros').filter((f) => f.endsWith('.html')).sort().map((f) => 'repros/' + f));

// Serve pages over http so that origins are sane.
const pages = new Map();
const server = http.createServer((q, s) => {
  const body = pages.get(q.url.split('?')[0]);
  if (body == null) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  s.end(body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
server.unref();
const base = `http://127.0.0.1:${server.address().port}`;
let n = 0;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] });
async function scan(html) {
  const path = `/p${++n}.html`;
  pages.set(path, html);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });
  await page.addScriptTag({ content: BUNDLE });
  const r = await page.evaluate(async () => JSON.parse(JSON.stringify(await window.a11ycore.runa11yCoreInPageAsync(location.href, null, {}, null))));
  await ctx.close();
  pages.delete(path);
  return r;
}
const sureLines = (r) => {
  const out = [];
  for (const c of r.checksResults) for (const o of c.occurrences || []) {
    const t = o.occurrenceOutcome || c.outcome;
    if ((t === 'fail' || t === 'cantTell') && !NOISE.test(c.ruleId)) out.push(`${c.ruleId} ${t} ${o.selector} ${o.data?.details?.reasonCode || ''}`);
  }
  return out.sort();
};
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const s1 = sureLines(await scan(html)), s2 = sureLines(await scan(html));
  const j1 = (await jsdomRun(html)).filter((x) => !NOISE.test(x)).sort(), j2 = (await jsdomRun(html)).filter((x) => !NOISE.test(x)).sort();
  console.log(`\n=== ${f}  (chromium runs identical: ${JSON.stringify(s1) === JSON.stringify(s2)}, jsdom runs identical: ${JSON.stringify(j1) === JSON.stringify(j2)})`);
  for (const l of s1) console.log('  SURE/chromium ' + l);
  for (const l of j1) console.log('  SURE/jsdom    ' + l);
  for (const l of await axNames(html)) console.log('  CHROMIUM-AX ' + l);
}
await b.close();
