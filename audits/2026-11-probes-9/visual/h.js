const { chromium } = require('/home/user/core-r9/node_modules/playwright');
const fs = require('fs');
const BUNDLE = '/home/user/core-r9/surea11y.browser.js';
let browser;
async function open(html, opts = {}) {
  if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1000, height: 700 }, deviceScaleFactor: opts.dpr || 1, colorScheme: opts.colorScheme });
  const page = await ctx.newPage();
  const doc = html.startsWith('<!doctype') ? html : `<!doctype html><html lang="en"><head><title>t</title>${opts.head||''}</head><body>${html}</body></html>`;
  await page.setContent(doc);
  if (opts.before) await opts.before(page);
  await page.addScriptTag({ path: BUNDLE });
  return page;
}
async function scan(page, rules, eo = {}) {
  return page.evaluate(async ([rules, eo]) => {
    const r = await window.a11ycore.runa11yCoreInPage(null, null, eo, rules);
    return r.checksResults.map(c => ({ rule: c.ruleId, outcome: c.outcome, error: c.error, data: c.data && { reason: c.data.reason, details: c.data.details },
      occ: (c.occurrences || []).map(o => ({ sel: o.selector, out: o.outcome, code: o.reasonCode || (o.data && (o.data.reasonCode || (o.data.details && o.data.details.reasonCode))), msg: (o.summary||o.message||'').slice(0, 400), d: o.data && (o.data.details || o.data) })) }));
  }, [rules, eo]);
}
async function run(html, rules, eo = {}, opts = {}) {
  const page = await open(html, opts);
  const r = await scan(page, rules, eo);
  if (!opts.keep) await page.context().close();
  return opts.keep ? { r, page } : r;
}
let decoder;
async function pixels(page, clip) {
  const buf = await page.screenshot({ clip });
  if (!decoder) decoder = await (await browser.newContext()).newPage();
  return decoder.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const counts = {};
    for (let i = 0; i < d.length; i += 4) { const k = '#' + [d[i], d[i+1], d[i+2]].map(v => v.toString(16).padStart(2, '0')).join(''); counts[k] = (counts[k] || 0) + 1; }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, buf.toString('base64'));
}
async function px(page, x, y) { return (await pixels(page, { x, y, width: 1, height: 1 }))[0][0]; }
function ratio(a, b) { const L = h => { const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]; }; const x=L(a),y=L(b); return ((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)).toFixed(2); }
function show(r, full) { for (const c of r) { console.log(c.rule, c.outcome, c.error ? 'ERR ' + JSON.stringify(c.error) : '', c.data && c.data.reason ? c.data.reason : ''); for (const o of c.occ) console.log('   ', o.out, o.code || '', o.sel, '|', o.msg.slice(0, 300), full ? JSON.stringify(o.d).slice(0, 800) : ''); } }
module.exports = { pixels, ratio, open, scan, run, px, show, close: () => browser && browser.close() };
