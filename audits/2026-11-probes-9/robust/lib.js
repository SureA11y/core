'use strict';
// Shared harness for round-9 robustness probes.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/home/user/core-r9/node_modules/playwright');

const CORE = process.env.CORE || '/home/user/core-r9';
const BUNDLE = path.join(CORE, 'surea11y.browser.js');

// pages: map path -> {body, type, headers}
function serve(pages) {
  return new Promise((resolve) => {
    const bundle = fs.readFileSync(path.join(process.env.CORE || CORE, 'surea11y.browser.js'));
    const server = http.createServer((req, res) => {
      const u = req.url.split('?')[0];
      if (u === '/surea11y.browser.js') {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        return res.end(bundle);
      }
      const p = pages[u];
      if (!p) {
        res.writeHead(404);
        return res.end('nf');
      }
      const page = typeof p === 'function' ? p(req) : p;
      res.writeHead(page.status || 200, { 'content-type': page.type || 'text/html; charset=utf-8', ...(page.headers || {}) });
      res.end(page.body);
    });
    server.listen(0, '127.0.0.1', () => {
      const base = `http://127.0.0.1:${server.address().port}`;
      resolve({ server, base, close: () => server.close() });
    });
  });
}

async function launch(opts = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', ...opts });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  return { browser, context };
}

async function addBundle(target, base) {
  await target.addScriptTag({ url: base + '/surea11y.browser.js' });
}

// Summary: ruleId -> "outcome xN"
function summarize(r) {
  if (!r || !r.checksResults) return r;
  const out = {};
  for (const c of r.checksResults) out[c.ruleId] = `${c.outcome} x${(c.occurrences || []).length}${c.error ? ' ERR:' + String(c.error).slice(0, 80) : ''}`;
  return out;
}

async function scanSummary(target, engineOptions = {}) {
  return target.evaluate(async (eo) => {
    try {
      const r = await window.a11ycore.runa11yCoreInPage(null, null, eo, null);
      const out = {};
      for (const c of r.checksResults) out[c.ruleId] = `${c.outcome} x${(c.occurrences || []).length}${c.error ? ' ERR:' + String(c.error).slice(0, 120) : ''}`;
      return { ok: true, out };
    } catch (e) {
      return { ok: false, code: e && e.code, msg: String(e && e.message).slice(0, 400), broken: e && e.broken };
    }
  }, engineOptions);
}

function diff(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const d = [];
  for (const k of keys) if ((a || {})[k] !== (b || {})[k]) d.push(`${k}: ${(a || {})[k]} -> ${(b || {})[k]}`);
  return d;
}

module.exports = { serve, launch, addBundle, summarize, scanSummary, diff, CORE };
