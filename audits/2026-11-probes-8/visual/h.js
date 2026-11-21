const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core-r8/surea11y.browser.js', 'utf8');
let browser;
async function getBrowser() { if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb'] }); return browser; }
async function run(html, rules, opts = {}) {
  const b = await getBrowser();
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1024, height: 768 }, deviceScaleFactor: opts.dpr || 1, colorScheme: opts.colorScheme, forcedColors: opts.forcedColors });
  const page = await ctx.newPage();
  await page.setContent(opts.quirks ? html : '<!doctype html>' + html);
  if (opts.before) await opts.before(page);
  await page.addScriptTag({ content: BUNDLE });
  const t0 = Date.now();
  const res = await page.evaluate(async ([rules, eo]) => {
    const r = await window.a11ycore.runa11yCoreInPage(null, null, Object.assign({ rules: { include: rules } }, eo), null);
    return r.checksResults.map(c => ({ ruleId: c.ruleId, outcome: c.outcome, error: c.error, occ: (c.occurrences || []).map(o => ({ sel: o.selector || (o.target && o.target.selector) || o.target, out: o.occurrenceOutcome, lean: o.lean, sum: o.summary, hint: o.hint, rc: o.data && o.data.details && o.data.details.reasonCode, m: o.data && o.data.details && (o.data.details.metrics), d: o.data && o.data.details })) }));
  }, [rules, opts.eo || {}]);
  const ms = Date.now() - t0;
  let extra; if (opts.after) extra = await opts.after(page);
  await ctx.close();
  return { res, ms, extra };
}
function show(label, r, full) {
  console.log('== ' + label + ' (' + r.ms + 'ms)');
  for (const c of r.res) {
    console.log('  ' + c.ruleId + ': ' + c.outcome + (c.error ? ' ERR ' + JSON.stringify(c.error).slice(0,200) : ''));
    for (const o of c.occ) console.log('    - ' + o.out + ' ' + (o.rc || '') + ' ' + String(JSON.stringify(o.sel)).slice(0, 80) + (full ? '\n      ' + o.sum + '\n      H: ' + o.hint + '\n      ' + JSON.stringify(o.m) : ''));
  }
}
module.exports = { run, show, close: async () => browser && browser.close() };
// pixel helper: screenshot + sample
async function shot(html, opts = {}) {
  const b = await getBrowser();
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1024, height: 768 }, deviceScaleFactor: opts.dpr || 1, colorScheme: opts.colorScheme, forcedColors: opts.forcedColors });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html>' + html);
  if (opts.before) await opts.before(page);
  const buf = await page.screenshot({ fullPage: !!opts.full });
  let out;
  if (opts.sample) out = await page.evaluate(async ([b64, pts]) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return pts.map(([x, y]) => Array.from(g.getImageData(x, y, 1, 1).data));
  }, [buf.toString('base64'), opts.sample]);
  if (opts.file) require('fs').writeFileSync(opts.file, buf);
  let ev; if (opts.eval) ev = await page.evaluate(opts.eval);
  await ctx.close();
  return { px: out, ev };
}
// luminance & ratio
function lum([r,g,b]) { const f = v => { v/=255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); }
function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
module.exports.shot = shot; module.exports.ratio = ratio;
