'use strict';
const fs = require('fs');
const http = require('http');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync(process.env.BUNDLE || '/home/user/core/surea11y.browser.js', 'utf8');
const LOC = {};
for (const l of ['de', 'es', 'fr', 'ja']) LOC[l] = fs.readFileSync(`/home/user/core/surea11y.i18n.${l}.js`, 'utf8');

const pages = new Map();
let server, port;
async function startServer() {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const html = pages.get(u.pathname);
    if (html == null) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
  return port;
}
function serve(p, html) { pages.set(p, html); return `http://127.0.0.1:${port}${p}`; }

async function launch(args = []) {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args });
}

async function inject(page, locales = []) {
  await page.addScriptTag({ content: BUNDLE });
  for (const l of locales) await page.addScriptTag({ content: LOC[l] });
}

async function scan(page, engineOptions = {}, runOnly = null) {
  return page.evaluate(([o, ro]) => {
    const r = window.a11ycore.runa11yCoreInPage(null, null, o, ro);
    return JSON.parse(JSON.stringify(r));
  }, [engineOptions, runOnly]);
}

module.exports = { launch, inject, scan, startServer, serve, BUNDLE, get server() { return server; } };
