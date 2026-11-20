// a11ycore.table()/highlight() treat a pass-tier occurrence (occurrenceOutcome:'pass') of a failing
// rule as a finding: a 'pass' row among the findings, and an amber "ask" box on the passing element.
const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const ruleSrc = `function (ctx) { return { outcome: 'fail', occurrences: [
  { __node: ctx.document.getElementById('a'), summary: 'A fails', hint: 'h', occurrenceOutcome: 'fail', data: { details: { reasonCode: 'X_FAIL' } } },
  { __node: ctx.document.getElementById('b'), summary: 'B passes', hint: 'h', occurrenceOutcome: 'pass', data: { details: { reasonCode: 'X_PASS' } } } ] }; }`;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent('<html lang="en"><head><title>t</title></head><body><main><p id="a">a</p><p id="b">b</p></main></body></html>');
  await page.addScriptTag({ content: bundle });
  const out = await page.evaluate(async (src) => {
    console.table = () => {};
    const rule = { id: 'org-tiers', meta: { title: 'T', description: 'd', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] }, runInPage: src };
    const r = await window.a11ycore.run({ customRules: [rule], runOnly: ['org-tiers'] });
    const rows = window.a11ycore.table(r);
    const marked = window.a11ycore.highlight(r);
    return { outcome: r.checksResults[0].outcome, tiers: r.checksResults[0].occurrences.map(o => o.occurrenceOutcome), rows: rows.map(x => x.outcome + ' ' + x.element + ' ' + x.summary), marked };
  }, ruleSrc);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
