// jsdom vs Chromium on every tests/fixtures/*.html: rule outcomes that differ.
// Layout-dependent rules are expected to differ; listed separately.
const h = require('./harness');
const fs = require('fs'), path = require('path');
const LAYOUT = /contrast|target-size|text-spacing|reflow|overlap|focus-visible|link-in-text-block|scrollable|orientation|css-hidden-focus|resize|visible|clip|offscreen|zoom|hidden-content|p-as-heading|region/;
(async () => {
  const dir = path.join(h.ROOT, 'tests/fixtures');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  const agg = {};
  for (const f of files) {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    let j;
    try { j = h.runJsdom(html).r; } catch (e) { console.log('jsdom threw', f, String(e).slice(0, 100)); continue; }
    const c = await h.runChromium(html, {}, { timeoutMs: 60000 });
    if (c.err) { console.log('chromium err', f, c.err.slice(0, 100)); continue; }
    const jm = Object.fromEntries(j.checksResults.map((x) => [x.ruleId, x]));
    for (const x of c.r.checksResults) {
      const y = jm[x.ruleId]; if (!y) continue;
      const selC = x.occurrences.map((o) => o.selector + ':' + (o.outcome || '')).sort().join('|');
      const selJ = y.occurrences.map((o) => o.selector + ':' + (o.outcome || '')).sort().join('|');
      if (x.outcome !== y.outcome || selC !== selJ) {
        const key = (LAYOUT.test(x.ruleId) ? 'L ' : 'N ') + x.ruleId;
        (agg[key] = agg[key] || []).push(`${f}: jsdom ${y.outcome}#${y.occurrences.length} chromium ${x.outcome}#${x.occurrences.length}` + (x.outcome === y.outcome ? ' (occurrences differ)' : ''));
      }
    }
  }
  for (const k of Object.keys(agg).sort()) { console.log(k, agg[k].length); if (k.startsWith('N')) agg[k].slice(0, 6).forEach((l) => console.log('    ' + l)); }
  await h.closeBrowser();
})();
