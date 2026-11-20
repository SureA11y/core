const fs = require('fs');
const { chromium } = require('/home/user/core/node_modules/playwright');
const P = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const sample = require('/home/user/core/tests/fixtures/packs/sample.js');
const html = require('./page.js');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const LAYOUT = /target-size|focus-not-obscured|text-spacing|reflow|contrast|content-on-hover|sample-contrast/;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.addScriptTag({ content: bundle });
  await page.addScriptTag({ content: P.packScript([sample]) });
  const name = sample.name + '@' + sample.version;
  for (const profile of [['wcag22-aa', 'sample-1.0'], ['sample-2.0', 'wcag21-a'], 'sample-1.0']) {
    const a = await page.evaluate(([n, p]) => window.a11ycore.runa11yCoreInPage(null, null, { packs: [n], profile: p }, null), [name, profile]);
    const j = runa11yCoreOnHtml(html, { engineOptions: { packs: [sample], profile } });
    const s = (r) => r.checksResults.filter(c => !LAYOUT.test(c.ruleId)).map(c => [c.ruleId, c.outcome, c.occurrences.length, JSON.stringify(c.verdicts || null), c.occurrences.map(o => JSON.stringify(o.verdicts || null) + o.occurrenceOutcome).join('')].join(' '));
    const rr = (r) => (r.rulesResults || []).map(x => x.ruleId + ' ' + x.outcome);
    const d = (x, y) => x.filter(l => !y.includes(l));
    const sa = s(a), sj = s(j);
    console.log(JSON.stringify(profile), 'checks diff', d(sa, sj).slice(0, 5), d(sj, sa).slice(0, 5), '| rollup diff', d(rr(a), rr(j)).slice(0, 6), d(rr(j), rr(a)).slice(0, 6), '| engine.packs', JSON.stringify(a.engine.packs), JSON.stringify(j.engine.packs), '| skipped', JSON.stringify(a.skippedPacks), JSON.stringify(j.skippedPacks));
  }
  await browser.close();
})();
