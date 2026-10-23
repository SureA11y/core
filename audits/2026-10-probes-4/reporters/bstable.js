'use strict';
const L = require('./lib.js');
const fs = require('fs'); const path = require('path');
const { runa11yCoreOnHtml } = require(L.C + '/src/testing.js');
const FIX = L.C + '/tests/fixtures';
const files = fs.readdirSync(FIX).filter(f => f.endsWith('.html'));
const keys = (r) => L.B.buildBaselineEntries(r).map(e => L.B.computeBaselineKey(e.ruleId, e.reasonCode, e.html, e.frame)).sort();
const edits = {
  prependP: h => h.replace(/<body([^>]*)>/i, '<body$1><p>unrelated intro</p>'),
  appendDiv: h => h.replace(/<\/body>/i, '<div>unrelated footer</div></body>'),
  headMeta: h => h.replace(/<\/head>/i, '<meta name="x" content="y"></head>'),
};
let diffs = 0;
for (const f of files) {
  const src = fs.readFileSync(path.join(FIX, f), 'utf8');
  const scan = (h) => runa11yCoreOnHtml(h, { url: 'https://example.test/' + f, entryPointParity: false });
  let a, b;
  try { a = scan(src); b = scan(src); } catch (e) { console.log('ERR', f, e.message); continue; }
  const ka = keys(a);
  if (JSON.stringify(ka) !== JSON.stringify(keys(b))) console.log('UNSTABLE identical', f);
  const sa = JSON.parse(L.renderSarifReport(a)).runs[0].results.map(r => r.partialFingerprints.primaryLocationLineHash).sort();
  const sb = JSON.parse(L.renderSarifReport(b)).runs[0].results.map(r => r.partialFingerprints.primaryLocationLineHash).sort();
  if (JSON.stringify(sa) !== JSON.stringify(sb)) console.log('SARIF hash unstable', f);
  for (const [en, ed] of Object.entries(edits)) {
    const h2 = ed(src); if (h2 === src) continue;
    let c; try { c = scan(h2); } catch (e) { continue; }
    const m = L.B.matchBaseline(c, L.B.buildBaselineEntries(a));
    if (m.newCount) {
      diffs++;
      console.log(`NEW after ${en}: ${f} new=${m.newCount} stale=${m.staleCount}`, (m.newOccurrences || []).slice(0, 3).map(o => (o.ruleId || '') + ' ' + String(o.html || (o.occurrence && o.occurrence.html) || '').slice(0, 100)).join(' | '));
    }
  }
}
console.log('done diffs', diffs);
