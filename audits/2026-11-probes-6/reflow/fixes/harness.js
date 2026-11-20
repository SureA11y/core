'use strict';
const { chromium } = require('/home/user/core/node_modules/playwright');
const BUNDLE_SRC = require('fs').readFileSync(process.env.BUNDLE, 'utf8'); const addBundle = (p) => p.addScriptTag({ content: BUNDLE_SRC });
const RULE_ID = 'reflow-horizontal-scroll';
function page(css, body, attrs = 'lang="en"') {
  return `<!doctype html><html ${attrs}><head><title>t</title><style>body{margin:8px;font:16px/1.4 sans-serif} ${css}</style></head><body>${body}</body></html>`;
}
async function withBrowser(fn) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  try { return await fn(browser); } finally { await browser.close(); }
}
async function scan(browser, html, { pageOptions = { viewport: { width: 320, height: 640 } }, engineOptions = {}, scope = null, before = null, raw = false } = {}) {
  const p = await browser.newPage(pageOptions);
  try {
    await p.setContent(html);
    if (before) await before(p);
    await addBundle(p);
    const opts = { rules: { include: RULE_ID }, ...engineOptions };
    const t0 = Date.now();
    const result = await p.evaluate(([o, s]) => window.a11ycore.runa11yCoreInPage(null, s, o, null), [opts, scope]);
    const ms = Date.now() - t0;
    const check = result.checksResults.find((r) => r.ruleId === RULE_ID);
    const env = await p.evaluate(() => ({ iw: innerWidth, cw: document.documentElement.clientWidth, sw: document.scrollingElement && document.scrollingElement.scrollWidth, dpr: devicePixelRatio }));
    if (raw) return { check, ms, env, result };
    return { outcome: check && check.outcome, data: check && check.data, error: check && check.error, ms, env,
      f: (check && check.occurrences || []).map((o) => [ (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || o.data.details.element, o.occurrenceOutcome, o.data.details.reasonCode, o.lean ? o.lean.toward : null, o.data.details.overflowPx ]) };
  } finally { await p.close(); }
}
async function runCases(cases) {
  await withBrowser(async (b) => {
    for (const c of cases) {
      try {
        const r = await scan(b, c.html, c.opts || {});
        console.log(`### ${c.name}\n  outcome=${r.outcome} data=${JSON.stringify(r.data)} env=${JSON.stringify(r.env)} ms=${r.ms}${r.error ? ' error=' + JSON.stringify(r.error) : ''}\n  ${JSON.stringify(r.f)}`);
      } catch (e) { console.log(`### ${c.name}\n  ERROR ${e.message}`); }
    }
  });
}
module.exports = { page, scan, withBrowser, runCases };
