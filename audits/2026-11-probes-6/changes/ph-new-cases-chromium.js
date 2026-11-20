const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const cases = {
  leadLine: ['<p><strong>Opening hours</strong><br>Monday to Friday, from nine in the morning to five in the evening.</p>', 'BOLD_LEAD_LINE'],
  leadAddress: ['<p><strong>ACME Ltd</strong><br>12 High Street<br>London</p>', ''],
  leadPhone: ['<p><b>Phone</b><br>555 123 456</p>', ''],
  divTitle: ['<div><b>Opening hours</b></div><div>Monday to Friday, from nine in the morning to five in the evening.</div>', 'BOLD_SHORT_DIV'],
  divFlexRow: ['<div style="display:flex"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, to every country.</div></div>', ''],
  divGrid: ['<div style="display:grid;grid-template-columns:10em 1fr"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, to every country.</div></div>', ''],
  divGridOne: ['<div style="display:grid"><div><b>Shipping</b></div><div>Free shipping on every order over fifty euros, to every country.</div></div>', 'BOLD_SHORT_DIV'],
  divPrice: ['<div><b>Price</b></div><div>$20 per month, billed annually.</div>', ''],
  divBadge: ['<div style="font-weight:bold">New</div><p>Our latest products, in stores now.</p>', ''],
  pBodySize: ['<p><b>Opening hours</b></p><p>Monday to Friday, 9 to 5.</p>', 'BOLD_SHORT_PARAGRAPH'],
  themeLight: ['<style>body{font-weight:300}</style><div><strong style="font-weight:400">Our story</strong></div><div>We started in a garage in 1998 and grew to three hundred people in four cities.</div>', 'BOLD_SHORT_DIV']
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  let bad = 0;
  for (const [k, [body, want]] of Object.entries(cases)) {
    await p.setContent(`<!doctype html><html lang="en"><head><title>t</title><style>body{font:16px/1.5 sans-serif}</style></head><body><main><h1>Page</h1>${body}</main></body></html>`);
    await p.addScriptTag({ content: bundle });
    const res = await p.evaluate(() => window.a11ycore.runa11yCoreInPage(null, null, { rules: { include: 'p-as-heading' } }, null));
    const c = res.checksResults.find((x) => x.ruleId === 'p-as-heading');
    const got = c.occurrences.map((o) => o.data.details.reasonCode).join(',');
    const ok = got === want;
    if (!ok) bad++;
    console.log(ok ? 'ok ' : 'BAD', k.padEnd(12), c.outcome, got || '-', ok ? '' : `want ${want || '-'}`);
  }
  await b.close();
  process.exit(bad ? 1 : 0);
})();
