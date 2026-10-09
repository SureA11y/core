'use strict';
// Old-vs-new corpus run in Chromium.
// usage: node run-corpus.js <corpusDir> <oldBundle> <newBundle> <outDir> [concurrency]
// Writes one summary JSON per page and run to <outDir>/<run>/<page>.json.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const [corpusDir, oldBundle, newBundle, outDir, concArg] = process.argv.slice(2);
const CONC = Number(concArg) || 4;
const RUNS = [
  { name: 'old', src: fs.readFileSync(oldBundle, 'utf8') },
  { name: 'new1', src: fs.readFileSync(newBundle, 'utf8') },
  { name: 'new2', src: fs.readFileSync(newBundle, 'utf8') }
];

function listHtml(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listHtml(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out.sort();
}

async function scanOnce(browser, file, run) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route('**/*', (r) => r.abort());
  const html = fs.readFileSync(file, 'utf8');
  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) {
    // keep going with what was parsed
  }
  await page.waitForTimeout(1500);
  await page.addScriptTag({ content: run.src });
  const res = await page.evaluate(() => {
    const t0 = performance.now();
    let r;
    try {
      r = window.a11ycore.runa11yCoreInPage(location.href, null, { perfStats: true, profileRules: true }, null);
    } catch (e) {
      return { thrown: String((e && e.stack) || e) };
    }
    const ms = performance.now() - t0;
    const rules = {};
    for (const c of r.checksResults) {
      rules[c.ruleId] = {
        outcome: c.outcome,
        n: (c.occurrences || []).length,
        sel: (c.occurrences || []).slice(0, 400).map((o) => [
          (o.shadowHostSelectors || []).concat(o.selector || '').join(' >>> '),
          o.outcome || null,
          (o.reasonCode || (o.details && o.details.reasonCode) || null)
        ]),
        error: c.error || null
      };
    }
    const timings = (r.perfStats && r.perfStats.ruleTimings) || null;
    return { ms, version: r.engine && r.engine.version, rules, timings };
  }, null);
  await ctx.close();
  return res;
}

(async () => {
  const files = listHtml(corpusDir);
  const browser = await chromium.launch();
  const queue = [];
  for (const f of files) for (const run of RUNS) queue.push({ f, run });
  // interleave runs per page so drift in machine load hits all three alike
  let i = 0;
  async function worker() {
    while (i < queue.length) {
      const { f, run } = queue[i++];
      const base = path.basename(f, '.html');
      const dir = path.join(outDir, run.name);
      fs.mkdirSync(dir, { recursive: true });
      const outFile = path.join(dir, `${base}.json`);
      if (fs.existsSync(outFile)) continue;
      let res;
      try {
        res = await scanOnce(browser, f, run);
      } catch (e) {
        res = { harnessError: String(e && e.message) };
      }
      fs.writeFileSync(outFile, JSON.stringify(res));
      process.stdout.write(`${run.name} ${base} ${res.ms ? res.ms.toFixed(0) + 'ms' : JSON.stringify(res).slice(0, 200)}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  await browser.close();
})();
