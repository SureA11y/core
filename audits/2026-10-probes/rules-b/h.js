const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
let browser;
async function open() { browser = browser || await chromium.launch(exe ? { executablePath: exe } : {}); return browser; }
async function scan(body, { rules, opts = {}, viewport = { width: 1280, height: 900 }, dpr = 1, head = '', scheme, full = false, pre } = {}) {
  const b = await open();
  const ctx = await b.newContext({ viewport, deviceScaleFactor: dpr, colorScheme: scheme });
  const p = await ctx.newPage();
  try {
    const html = body.startsWith('<!doctype') ? body : `<!doctype html><html lang="en"><head><title>t</title>${head}<style>body{margin:0;font:16px Arial, sans-serif}</style></head><body>${body}</body></html>`;
    await p.setContent(html);
    if (pre) await pre(p);
    await p.addScriptTag({ content: BUNDLE });
    const res = await p.evaluate(([inc, o]) => window.a11ycore.runa11yCoreInPage(null, null, Object.assign({ rules: inc ? { include: inc } : undefined }, o), null), [rules, opts]);
    if (full) return res;
    return summarize(res, rules);
  } finally { await ctx.close(); }
}
function summarize(res, rules) {
  const out = {};
  for (const c of res.checksResults) {
    if (rules && !rules.includes(c.ruleId)) continue;
    out[c.ruleId] = { outcome: c.outcome, occ: c.occurrences.map(o => ({ sel: o.selector, oc: o.outcome, rc: o.data && o.data.details && o.data.details.reasonCode, d: o.data && o.data.details })), margin: c.margin };
  }
  return out;
}
async function close() { if (browser) await browser.close(); }
module.exports = { scan, close, summarize, BUNDLE };
