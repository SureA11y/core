// Fast screening: SureA11y only, plus pixel sampling of selected elements.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { decodePNG, regionStats } from './png.mjs';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] }); }
// opts: rules (array), sample (array of selectors), engineOptions, viewport, context, before
export async function run(browser, html, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1000, height: 700 }, ...(opts.context || {}) });
  const page = await ctx.newPage();
  if (opts.initScript) await page.addInitScript(opts.initScript);
  if (opts.route) await opts.route(page);
  await page.goto(opts.url || 'data:text/html,' + encodeURIComponent(html));
  if (opts.url) { /* nothing */ }
  if (opts.before) await opts.before(page);
  const out = { samples: {} };
  for (const sel of opts.sample || []) {
    const el = await page.$(sel); if (!el) { out.samples[sel] = 'missing'; continue; }
    const box = await el.boundingBox();
    const png = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.max(1, box.width), height: Math.max(1, box.height) }, animations: 'disabled', caret: 'hide' });
    out.samples[sel] = regionStats(decodePNG(png), 0, 0, 1e5, 1e5);
  }
  await page.addScriptTag({ content: BUNDLE });
  const r = await page.evaluate(async (o) => JSON.parse(JSON.stringify(await window.a11ycore.runa11yCoreInPageAsync(location.href, null, o.eo || {}, o.rules || null))), { eo: opts.engineOptions, rules: opts.rules });
  out.raw = r;
  out.res = (r.checksResults || []).filter((c) => !opts.rules || opts.rules.includes(c.ruleId)).map((c) => ({ rule: c.ruleId, outcome: c.outcome, occ: (c.occurrences || []).map((o) => ({ sel: o.selector, tier: o.tier, reason: o.data?.details?.reasonCode, ratio: o.data?.details?.metrics?.ratio ?? o.data?.details?.ratio, fg: o.data?.details?.colors?.foregroundHex, bg: o.data?.details?.colors?.backgroundHex, sum: o.summary })) , margin: c.margin }));
  await ctx.close();
  return out;
}
export function show(o) {
  const l = [];
  for (const [s, v] of Object.entries(o.samples)) l.push(`PIX ${s}: ${typeof v === 'string' ? v : `fg ${v.fg} bg ${v.bg} max ${v.maxRatio}`}`);
  for (const c of o.res) l.push(`${c.rule} ${c.outcome}${c.margin ? ' margin=' + JSON.stringify(c.margin).slice(0, 150) : ''} :: ` + c.occ.filter((x) => x.tier !== 'pass' || process.env.ALL).map((x) => `[${x.tier}${x.reason ? ':' + x.reason : ''}${x.ratio ? ' r=' + x.ratio : ''}${x.fg ? ' ' + x.fg + '/' + x.bg : ''}] ${x.sel}`).join(' ; '));
  return l.join('\n');
}
// Tiny http server so pages have a real origin. serve(path, body) registers a page.
import http from 'node:http';
const pages = new Map();
const server = http.createServer((req, res) => { const p = req.url.split('?')[0]; const b = pages.get(p); if (b == null) { res.writeHead(404); return res.end(); } const type = p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'; res.writeHead(200, { 'content-type': type, ...(p.startsWith('/cors') ? { 'access-control-allow-origin': '*' } : {}) }); res.end(b); });
await new Promise((r) => server.listen(0, '127.0.0.1', r)); server.unref();
export const base = `http://127.0.0.1:${server.address().port}`;
export const base2 = `http://localhost:${server.address().port}`;
export function serve(path, body) { pages.set(path, body); return base + path; }
