const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
let browser;
async function getBrowser() { if (!browser) browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); return browser; }
async function runChromium(html, rule, opts = {}) {
  const b = await getBrowser();
  const page = await b.newPage({ viewport: { width: opts.width || 320, height: opts.height || 640 } });
  await page.setContent(html, { waitUntil: 'load' });
  if (opts.before) await page.evaluate(opts.before);
  await page.addScriptTag({ content: BUNDLE });
  const t0 = Date.now();
  const res = await page.evaluate(async ([rule, eo]) => {
    const r = await window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: rule }, ...(eo||{}) }, null);
    const c = r.checksResults.find(x => x.ruleId === rule) || {};
    return { outcome: c.outcome, data: c.data, error: c.error, occ: (c.occurrences || []).map(o => ({ o: o.occurrenceOutcome, code: o.data && o.data.details && o.data.details.reasonCode, lean: o.lean && (o.lean.toward + ':' + (o.lean.i18n||{}).whyKey), sel: o.selector, over: o.data && o.data.details && o.data.details.overflowPx, edge: o.data&&o.data.details&&o.data.details.edge })) };
  }, [rule, opts.eo]);
  res.ms = Date.now() - t0;
  const extra = opts.after ? await page.evaluate(opts.after) : undefined;
  if (extra !== undefined) res.extra = extra;
  await page.close();
  return res;
}
async function runJsdom(html, rule) {
  const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
  const t0 = Date.now();
  const r = await runa11yCoreOnHtml(html, { rules: { include: rule } });
  const c = r.checksResults.find(x => x.ruleId === rule) || {};
  await new Promise(r => setImmediate(r));
  return { ms: Date.now() - t0, outcome: c.outcome, error: c.error, occ: (c.occurrences || []).map(o => ({ o: o.occurrenceOutcome, code: o.data && o.data.details && o.data.details.reasonCode, sel: o.selector, lean: o.lean && o.lean.toward })) };
}
async function close() { if (browser) await browser.close(); }
module.exports = { runChromium, runJsdom, close };
