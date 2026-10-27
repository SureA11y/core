'use strict';
// Runs one rule on an HTML snippet in Chromium with the old and the new bundle.
// usage: node snippet.js <oldBundle> <newBundle> <ruleId> '<html>'
const fs = require('node:fs');
const { chromium } = require('playwright');
const [oldB, newB, ruleId, html] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const [label, bundle] of [['old', oldB], ['new', newB]]) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    await p.setContent(html);
    await p.addScriptTag({ content: fs.readFileSync(bundle, 'utf8') });
    const r = await p.evaluate((id) => {
      const r = window.a11ycore.runa11yCoreInPage(location.href, null, { optInRules: 'all' }, { includeRuleIds: [id] });
      const c = r.checksResults.find((x) => x.ruleId === id);
      return { outcome: c.outcome, error: c.error || null, occ: c.occurrences.map((o) => o.selector + ' :: ' + (o.summary || '').slice(0, 160)) };
    }, ruleId);
    console.log(label, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
