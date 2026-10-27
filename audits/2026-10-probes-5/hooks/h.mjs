// Small runner for the hooks probes: SURE only, in Chromium, with the hooks
// as init scripts.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
const req = createRequire('/home/user/core/package.json');
const { chromium } = req('playwright');
const core = req('/home/user/core/src/index.js');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
export const HOOKS = {
  listener: core.listenerHookScript(),
  live: core.liveRegionHookScript(),
  internals: core.internalsHookScript()
};

const pages = new Map();
const server = http.createServer((q, s) => {
  const b = pages.get(q.url.split('?')[0]);
  if (b == null) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  s.end(b);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
server.unref();
const base = `http://127.0.0.1:${server.address().port}`;
let n = 0;

export async function open() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
}

// Returns { rules: {ruleId: {outcome, occ:[{sel, tier, reason, details}]}}, env, extra }
export async function scan(browser, html, opts = {}) {
  const path = `/h${++n}.html`;
  pages.set(path, html);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  for (const h of opts.hooks || []) await page.addInitScript({ content: HOOKS[h] });
  if (opts.initScript) await page.addInitScript(opts.initScript);
  await page.goto(base + path, { waitUntil: 'load' });
  if (opts.before) await opts.before(page);
  if (opts.lateHooks) for (const h of opts.lateHooks) await page.evaluate(HOOKS[h]);
  await page.addScriptTag({ content: BUNDLE });
  const out = await page.evaluate(async (o) => {
    const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, o.engineOptions || {}, o.runOnly || null);
    const rules = {};
    for (const c of r.checksResults || []) {
      rules[c.ruleId] = {
        outcome: c.outcome,
        occ: (c.occurrences || []).map((x) => ({ sel: x.selector, tier: x.tier, reason: x.data?.details?.reasonCode, details: x.data?.details, sum: x.summary }))
      };
    }
    let extra = null;
    if (o.extra) extra = await (0, eval)(o.extra);
    return JSON.parse(JSON.stringify({ rules, env: r.engine?.environment, extra }));
  }, { engineOptions: opts.engineOptions, runOnly: opts.runOnly, extra: opts.extra });
  out.errors = errors;
  await ctx.close();
  pages.delete(path);
  return out;
}

export function show(name, res, ruleIds) {
  const lines = [`== ${name}  env.listenerHook=${res.env?.listenerHook} liveRegionHook=${res.env?.liveRegionHook}${res.errors.length ? ' PAGEERR ' + res.errors.join('|') : ''}`];
  for (const id of ruleIds) {
    const r = res.rules[id];
    if (!r) { lines.push(`  ${id}: (absent)`); continue; }
    lines.push(`  ${id}: ${r.outcome} ${r.occ.map((o) => `[${o.tier}:${o.reason}] ${o.sel}`).join(' ; ')}`);
  }
  if (res.extra != null) lines.push('  extra: ' + JSON.stringify(res.extra).slice(0, 600));
  return lines.join('\n');
}

// A URL serving html, for probes that drive the page themselves.
export function serve(html) {
  const path = `/s${++n}.html`;
  pages.set(path, html);
  return base + path;
}
