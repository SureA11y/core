// Browser harness: serves pages + bundle; ROOT selects build
const ROOT = process.env.ROOT || '/home/user/r12-api';
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/tmp/scratch/pw1234';
const { chromium } = require('/home/user/r12-api/node_modules/playwright');
const http = require('http'); const fs = require('fs');
const bundle = fs.readFileSync(process.env.IIFE ? __dirname + '/core-iife-' + process.env.IIFE + '.js' : ROOT + '/surea11y.browser.js');
let pages = {};
let srv, port, browser;
async function start() {
  srv = http.createServer((q, s) => { const u = q.url.split('?')[0]; if (u === '/core.js') { s.setHeader('content-type', 'text/javascript'); return s.end(bundle); } s.setHeader('content-type', 'text/html'); s.end(pages[u] || '<!doctype html><title>x</title><p>none'); });
  await new Promise(r => srv.listen(0, r)); port = srv.address().port;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium' });
  return { port, browser };
}
async function open(path, html, opts = {}) { pages[path] = html; const page = await browser.newPage(opts.viewport ? { viewport: opts.viewport } : {}); const logs = []; page.on('console', m => logs.push(m.type()[0] + ' ' + m.text().slice(0, 300))); page.on('pageerror', e => logs.push('PAGEERR ' + e.message)); await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: 'load' }); return { page, logs }; }
async function stop() { await browser.close(); srv.close(); }
module.exports = { start, open, stop, pages: (p) => Object.assign(pages, p), ROOT };
