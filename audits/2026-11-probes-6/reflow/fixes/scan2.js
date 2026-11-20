// As scan.js, also printing the result's data (reason, omitted).
const { scan, page, chromium } = require('./scan.js');
const fs = require('fs');
const BUNDLE = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, html, opts] of require(process.argv[2])(page)) {
    const p = await browser.newPage({ viewport: { width: 320, height: 640 } });
    await p.setContent(html); await p.addScriptTag({ content: BUNDLE });
    const r = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'reflow-horizontal-scroll' } }, null).checksResults.find((x) => x.ruleId === 'reflow-horizontal-scroll'));
    const f = (r.occurrences || []).map((o) => [(String(o.html || '').match(/id="([^"]+)"/) || [])[1] || o.data.details.element, o.occurrenceOutcome, o.data.details.reasonCode, o.lean ? o.lean.toward : null]);
    console.log(name.padEnd(42), r.outcome, JSON.stringify(r.data || null), f.length > 4 ? `${f.length} findings, first ${JSON.stringify(f[0])}` : JSON.stringify(f));
    await p.close();
  }
  await browser.close();
})();
