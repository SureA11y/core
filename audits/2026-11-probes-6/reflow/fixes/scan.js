// Scan one page at a viewport with the committed browser bundle; print each
// reflow finding as [id, tier, code, lean, edge].
const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
async function scan(browser, html, { width = 320, engineOptions = {}, pageOptions = {} } = {}) {
  const p = await browser.newPage({ viewport: { width, height: 640 }, ...pageOptions });
  try {
    await p.setContent(html);
    await p.addScriptTag({ content: BUNDLE });
    const r = await p.evaluate((o) => window.a11ycore.runa11yCoreInPage(null, null, o, null)
      .checksResults.find((x) => x.ruleId === 'reflow-horizontal-scroll'), { rules: { include: 'reflow-horizontal-scroll' }, ...engineOptions });
    return { outcome: r.outcome, reason: r.data && r.data.reason, findings: (r.occurrences || []).map((o) => [
      (String(o.html || '').match(/id="([^"]+)"/) || [])[1] || o.data.details.element, o.occurrenceOutcome, o.data.details.reasonCode, o.lean ? o.lean.toward : null, o.data.details.edge]) };
  } finally { await p.close(); }
}
const page = (css, body, attrs = 'lang="en"') =>
  `<!doctype html><html ${attrs}><head><title>t</title><style>body{margin:8px;font:16px/1.4 sans-serif} ${css}</style></head><body>${body}</body></html>`;
module.exports = { scan, page, chromium };
if (require.main === module) {
  (async () => {
    const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
    const cases = require(process.argv[2]);
    for (const [name, html, opts] of cases(page)) console.log(name.padEnd(58), JSON.stringify(await scan(browser, html, opts)));
    await browser.close();
  })();
}
