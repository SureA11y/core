// Small Chromium harness for the API probes: serves pages and the bundle over http.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
const CORE = '/home/user/core';
const req = createRequire(CORE + '/package.json');
export const { chromium } = req('playwright');
const files = {
  '/surea11y.browser.js': () => fs.readFileSync(CORE + '/surea11y.browser.js', 'utf8'),
  '/surea11y.report.js': () => fs.readFileSync(CORE + '/surea11y.report.js', 'utf8')
};
const pages = new Map();
const server = http.createServer((rq, rs) => {
  const p = rq.url.split('?')[0];
  if (files[p]) { rs.writeHead(200, { 'content-type': 'text/javascript' }); return rs.end(files[p]()); }
  const pg = pages.get(p);
  if (!pg) { rs.writeHead(404); return rs.end(); }
  rs.writeHead(200, { 'content-type': pg.type || 'text/html; charset=utf-8', ...(pg.headers || {}) });
  rs.end(pg.body);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
server.unref();
export const base = `http://127.0.0.1:${server.address().port}`;
let n = 0;
export function serve(body, opts = {}) { const p = opts.path || `/q${++n}.html`; pages.set(p, { body, ...opts }); return base + p; }
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
// Open html in a page and load the bundle with a <script src> tag (works under CSP 'self').
export async function open(browser, html, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  if (opts.console) page.on('console', (m) => console.log('CONSOLE', m.type(), m.text().slice(0, 300)));
  if (opts.initScript) await page.addInitScript(opts.initScript);
  await page.goto(serve(html, opts), { waitUntil: 'load' });
  if (!opts.noBundle) await page.evaluate(() => new Promise((res, rej) => { const s = document.createElement('script'); s.src = '/surea11y.browser.js'; s.onload = res; s.onerror = () => rej(new Error('bundle blocked')); document.head.append(s); }));
  return { ctx, page };
}
