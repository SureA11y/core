'use strict';
// target-size-minimum on the same page at two scroll positions: a small target with a close neighbour / an
// absolutely positioned cover, once in view and once below the fold. Docs: targets below the fold are measured as
// those in view. node target-scroll.js [bundle]
const fs = require('fs');
const C = require('./chrome-lib.js');
const BUNDLE = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : C.BUNDLE;
const block = (i) => `<div style="position:relative;height:60px">
  <button id="t${i}" style="position:absolute;left:10px;top:10px;width:30px;height:30px;padding:0">A</button>
  <div style="position:absolute;left:10px;top:10px;width:30px;height:14px;background:#c00"></div>
  <button style="position:absolute;left:60px;top:10px;width:16px;height:16px;padding:0">b</button>
  <button style="position:absolute;left:78px;top:10px;width:16px;height:16px;padding:0">c</button>
</div>`;
const PAGE = `<!DOCTYPE html><html lang="en"><head><title>T</title><style>body{margin:0}</style></head><body><main><h1>T</h1>
${block(1)}<div style="height:3000px">spacer</div>${block(2)}<div style="height:3000px">spacer</div></main></body></html>`;
(async () => {
  const b = await C.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.setContent(PAGE);
  await p.evaluate(BUNDLE);
  const scanAt = (y) => p.evaluate((y) => {
    window.scrollTo(0, y);
    const r = window.a11ycore.runa11yCoreInPage(null, null, {}, { includeRuleIds: ['target-size-minimum'] });
    const c = r.checksResults[0];
    return { y: scrollY, outcome: c.outcome, occ: c.occurrences.map((o) => o.selector + ' ' + (o.occurrenceOutcome || '') + ' ' + ((o.data && o.data.details && o.data.details.reasonCode) || '')).sort() };
  }, y);
  const a = await scanAt(0);
  const m = await p.evaluate(() => document.getElementById('t2').getBoundingClientRect().top + scrollY - 200);
  const c = await scanAt(m);
  const d = await scanAt(0);
  console.log(JSON.stringify({ top: a, scrolledToSecond: c, topAgain: d, same: JSON.stringify(a.occ) === JSON.stringify(c.occ) }, null, 1));
  await b.close();
})();
