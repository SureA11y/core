'use strict';
// Chromium: each layout-dependent rule run alone agrees with the full scan, on every fixture (and mutated fixtures).
// node singles-chrome.js <fix|mut> from to
const fs = require('fs');
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const G = require('./gen.js');
const FIX = '/home/user/core-r8/tests/fixtures';
const files = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const [mode, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]];
const RULES = ['target-size-minimum', 'target-size-enhanced', 'focus-not-obscured-minimum', 'focus-not-obscured-enhanced', 'text-spacing-content-loss', 'reflow-horizontal-scroll', 'contrast-minimum', 'contrast-computable', 'skip-link', 'link-in-text-block', 'scrollable-region-focusable', 'css-orientation-lock', 'p-as-heading', 'duplicate-id-aria', 'listitem-parent-valid', 'aria-valid-attr-value'];
(async () => {
  const b = await C.launch();
  let scans = 0, bad = 0;
  for (let i = from; i < to; i++) {
    const f = files[i % files.length];
    let html = fs.readFileSync(`${FIX}/${f}`, 'utf8');
    if (mode === 'mut') html = G.mutate(html, i * 104729 + 17);
    const ctx = await b.newContext();
    const p = await ctx.newPage();
    p.on('dialog', (d) => d.dismiss().catch(() => {}));
    try {
      await p.setContent(html, { timeout: 15000 }).catch(() => {});
      await p.evaluate(C.BUNDLE);
      const res = await p.evaluate((RULES) => {
        const full = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
        const ids = new Set(full.checksResults.map((c) => c.ruleId));
        const out = [];
        for (const id of RULES.map((r) => (ids.has(r) ? r : ids.has(r + '-manual') ? r + '-manual' : null)).filter(Boolean)) {
          const one = window.a11ycore.runa11yCoreInPage(null, null, {}, { includeRuleIds: [id] }).checksResults.find((c) => c.ruleId === id);
          const a = full.checksResults.find((c) => c.ruleId === id);
          const sig = (c) => JSON.stringify([c.outcome, c.error || null, c.occurrences.map((o) => [o.selector, o.occurrenceOutcome || '', o.summary])]);
          out.push({ id, same: sig(a) === sig(one), a: sig(a).slice(0, 300), b: sig(one).slice(0, 300) });
        }
        return out;
      }, RULES);
      for (const x of res) { scans++; if (!x.same) { bad++; console.log(JSON.stringify({ i, f, rule: x.id, full: x.a, alone: x.b })); } }
    } catch (e) { console.log('THROW', i, f, String(e.message).slice(0, 150)); }
    await ctx.close();
  }
  console.log(JSON.stringify({ mode, from, to, singleRuns: scans, mismatches: bad }));
  await b.close();
})();
