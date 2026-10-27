'use strict';
// Serial timing of old vs new bundle per corpus page: alternates old/new
// REPS times on fresh pages and keeps the fastest scan of each.
// usage: node timing.js <corpusDir> <oldBundle> <newBundle> <out.json> [reps] [profile]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const [corpusDir, oldB, newB, outFile, repsArg, profile] = process.argv.slice(2);
const REPS = Number(repsArg) || 3;
const src = { old: fs.readFileSync(oldB, 'utf8'), new: fs.readFileSync(newB, 'utf8') };
const files = fs.readdirSync(corpusDir).filter((f) => f.endsWith('.html')).sort();
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const f of files) {
    const html = fs.readFileSync(path.join(corpusDir, f), 'utf8');
    const res = { old: [], new: [], rt: { old: null, new: null } };
    for (let i = 0; i < REPS; i++) {
      for (const which of ['old', 'new']) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        try {
        const page = await ctx.newPage();
        await page.route('**/*', (r) => r.abort());
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.addScriptTag({ content: src[which] });
        const r = await page.evaluate((prof) => {
          const t0 = performance.now();
          const r = window.a11ycore.runa11yCoreInPage(location.href, null, prof ? { perfStats: true, profileRules: true } : {}, null);
          return { ms: performance.now() - t0, rt: r.perfStats && r.perfStats.ruleTimings };
        }, !!profile);
        res[which].push(r.ms);
        if (r.rt && (!res.rt[which] || r.ms === Math.min(...res[which]))) res.rt[which] = r.rt;
        } catch (e) {
          res.err = String(e && e.message).slice(0, 200);
        }
        await ctx.close().catch(() => {});
      }
    }
    out[f] = { err: res.err, old: Math.min(...res.old), new: Math.min(...res.new), oldAll: res.old, newAll: res.new, rt: res.rt };
    process.stdout.write(`${f} ${out[f].old.toFixed(0)} ${out[f].new.toFixed(0)}\n`);
  }
  fs.writeFileSync(outFile, JSON.stringify(out));
  await browser.close();
})();
