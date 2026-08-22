'use strict';

/**
 * engine-perf-bench.js (process-isolated)
 *
 * Run:
 *   node scripts/engine-perf-bench.js
 *   node scripts/engine-perf-bench.js --iters=5 --warmup=1
 *   node scripts/engine-perf-bench.js --html=path/to/page.html
 *
 * Generated fixtures:
 *   # Legacy / broad stressors
 *   node scripts/engine-perf-bench.js --generated=big               (alias for bigTransparent)
 *   node scripts/engine-perf-bench.js --generated=bigTransparent
 *   node scripts/engine-perf-bench.js --generated=bigOpaque
 *
 *   # Contrast-focused fixtures (reduce img checks dominating; exercise background paths)
 *   node scripts/engine-perf-bench.js --generated=contrastTransparent
 *   node scripts/engine-perf-bench.js --generated=contrastOpaque
 *
 * Why process isolation?
 * - JSDOM + engines often retain memory across iterations in-process (by design or accident).
 * - Spawning a fresh Node process per iteration makes time + memory deltas trustworthy.
 *
 * Notes:
 * - contrast* fixtures intentionally use far fewer <img> so img-alt-quality won't dominate totals,
 *   and they stamp attributes onto the actual text-bearing elements to reliably exercise contrast paths.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgv(argv) {
  const out = {
    iters: 5,
    warmup: 1,
    html: null,
    generated: 'big', // alias for bigTransparent (kept for backward-compat)
    exposeGc: true,
    top: 15,
    profileRules: false
  };

  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) {
      const k = m[1];
      const v = m[2];
      if (k === 'iters') out.iters = Math.max(1, Number(v) || out.iters);
      else if (k === 'warmup') out.warmup = Math.max(0, Number(v) || out.warmup);
      else if (k === 'html') out.html = v;
      else if (k === 'generated') out.generated = v;
      else if (k === 'exposeGc') out.exposeGc = v !== 'false';
      else if (k === 'top') out.top = Math.max(0, Number(v) || out.top);
      else if (k === 'profileRules') out.profileRules = v !== 'false';
    }
  }
  return out;
}

/**
 * Generate a large HTML page. `variant` controls CSS to exercise different perf paths.
 *
 * Variants:
 * - bigTransparent (default-ish): backgrounds transparent, encourages ancestor background walking.
 * - bigOpaque: wraps content in blocks with explicit opaque background-color (intended fast-path friendly).
 *
 * Contrast-focused variants (reduce images to avoid img-alt-quality dominating):
 * - contrastTransparent: many eligible text elements with transparent backgrounds.
 * - contrastOpaque: same structure, but text-bearing elements have explicit opaque backgrounds and opacity:1.
 *
 * NOTE: This is not intended to be a perfect "real web page", only a stable stressor.
 */
function makeBigHtml({
  buttons = 3000,
  inputs = 300,
  images = 800,
  headings = 300,
  variant = 'bigTransparent'
} = {}) {
  const variantNorm = String(variant || '').trim();

  const isContrast =
    variantNorm.toLowerCase() === 'contrastopaque' ||
    variantNorm.toLowerCase() === 'contrasttransparent';

  // For contrast fixtures, reduce images drastically so img-alt-quality does not dominate.
  // Keep plenty of labels/buttons/headings (text-bearing) to stress contrast.
  if (isContrast) {
    images = Math.min(20, Math.max(0, Number(images) || 0) || 20);
    buttons = Math.max(2000, Number(buttons) || 0);
    inputs = Math.max(500, Number(inputs) || 0);
    headings = Math.max(800, Number(headings) || 0);
  }

  // Stamp an attribute on text-bearing elements so CSS targets exactly the elements that getTextScan() returns.
  const textAttr = isContrast ? ' data-contrast-text="1"' : '';

  const btns = Array.from({ length: buttons })
    .map((_, i) => `<button${textAttr} id="b${i}" aria-label="Button ${i}">Button</button>`)
    .join('');

  const ins = Array.from({ length: inputs })
    .map((_, i) => `<label${textAttr} for="i${i}">Input ${i}</label><input id="i${i}" />`)
    .join('');

  const imgs = Array.from({ length: images })
    .map((_, i) => `<img src="x${i}.png" alt="Image ${i}">`)
    .join('');

  const hs = Array.from({ length: headings })
    .map((_, i) => `<h${(i % 6) + 1}${textAttr}>Heading ${i}</h${(i % 6) + 1}>`)
    .join('');

  // CSS knobs. Keep deterministic / stable.
  let css;
  let bodyAttrs = '';
  let wrapperOpen = '';
  let wrapperClose = '';

  if (variantNorm.toLowerCase() === 'contrastopaque') {
    css = `
      body { margin: 0; padding: 16px; background: #eee; color: #111; }
      /* Force self-opaque background directly on text-bearing elements. */
      [data-contrast-text="1"] { background-color: #fff !important; opacity: 1 !important; }
    `;
  } else if (variantNorm.toLowerCase() === 'contrasttransparent') {
    css = `
      body { margin: 0; padding: 16px; background: transparent; color: #111; }
      /* Force transparent background directly on text-bearing elements. */
      [data-contrast-text="1"] { background-color: transparent !important; opacity: 1 !important; }
    `;
  } else if (variantNorm.toLowerCase() === 'bigopaque') {
    css = `
      body { margin: 0; padding: 16px; background: #eee; color: #111; }
      /* Opaque wrappers so many text-containing elements have self-opaque backgrounds */
      .blk { background: #fff; padding: 8px 10px; margin: 8px 0; border-radius: 4px; }
      /* Also make common text containers self-opaque */
      h1,h2,h3,h4,h5,h6,label,button { background: #fff; }
      /* Keep opacity at 1 to preserve fast-path conditions */
    `;
    wrapperOpen = `<div class="blk">`;
    wrapperClose = `</div>`;
  } else {
    // bigTransparent (and legacy 'big')
    css = `
      body { margin: 0; padding: 16px; background: transparent; color: #111; }
      /* Encourage background compositing/ancestor walking */
      h1,h2,h3,h4,h5,h6,label,button,div,section { background: transparent; }
    `;
  }

  const sections = [
    { id: 'headings', html: hs },
    { id: 'inputs', html: ins },
    { id: 'images', html: imgs },
    { id: 'buttons', html: btns }
  ];

  const sectionHtml = sections
    .map((s) => `${wrapperOpen}<section id="${s.id}">${s.html}</section>${wrapperClose}`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Perf Bench</title>
    <style>${css}</style>
  </head>
  <body${bodyAttrs}>
    ${sectionHtml}
  </body>
</html>`;
}

function topCounters(counters, limit) {
  const entries = [];
  const obj = counters && typeof counters === 'object' ? counters : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'number' && v) entries.push([k, v]);
  }
  // Deterministic: value desc, key asc
  entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const n = Math.max(0, Number(limit) || 0) || 15;
  return entries.slice(0, n).map(([key, value]) => ({ key, value }));
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const t = idx - lo;
  return sorted[lo] + (sorted[hi] - sorted[lo]) * t;
}

function fmtMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function runWorkerOnce(payload) {
  const workerPath = __filename;
  const nodeArgs = [];
  if (payload.exposeGc) nodeArgs.push('--expose-gc');
  nodeArgs.push(workerPath, '--worker=1');

  const proc = spawnSync(process.execPath, nodeArgs, {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50
  });

  if (proc.error) throw proc.error;
  if (proc.status !== 0) {
    const err = proc.stderr || proc.stdout || `worker exit code ${proc.status}`;
    throw new Error(err);
  }

  const txt = (proc.stdout || '').trim();
  try {
    return JSON.parse(txt);
  } catch (e) {
    throw new Error(`Worker did not return JSON. Got:\n${txt}`, { cause: e });
  }
}

/**
 * Worker mode: reads JSON payload from stdin, runs engine once, prints JSON result.
 * Keeps parent process clean/stable.
 */
function workerMain() {
  const raw = fs.readFileSync(0, 'utf8');
  const payload = JSON.parse(raw);

  function gcIfAvailable() {
    try {
      if (typeof global.gc === 'function') global.gc();
    } catch (_) {}
  }

  function hrMs(startNs) {
    const end = process.hrtime.bigint();
    return Number(end - startNs) / 1e6;
  }

  const html = payload.html;
  const engineOptions = payload.engineOptions || { perfStats: true, includeShadowDom: false };

  // IMPORTANT: keep this require inside the worker so module state doesn't leak into parent.
  // Also IMPORTANT: this must happen BEFORE memBefore/t0 are captured below. Requiring
  // this module pulls in jsdom and the whole generated core.js, which cold-loads in the
  // ~200ms range by itself. Measuring from before the require conflates one-time module-load
  // cost with actual per-page engine-scan cost (a real bug this comment guards against
  // regressing back into: a cold `require()` of this module alone
  // took ~227ms in a fresh process in testing, larger than most real page scans this bench measures).
  const { runa11yCoreOnHtml } = require('../tests/helpers/runDomRulesOnHtml');

  // Measure process memory (not perfect, but consistent within a single run)
  gcIfAvailable();
  const memBefore = process.memoryUsage();
  const t0 = process.hrtime.bigint();

  function extractRuleTimings(result) {
    if (!result) return null;
    if (result.ruleTimings) return result.ruleTimings;
    if (result.perfStats && result.perfStats.ruleTimings) return result.perfStats.ruleTimings;
    if (result._debug && result._debug.ruleTimings) return result._debug.ruleTimings;
    if (result.stats && result.stats.ruleTimings) return result.stats.ruleTimings;
    return null;
  }

  function extractPerfCounters(result) {
    if (!result) return null;
    if (result.perfStats && result.perfStats.counters) return result.perfStats.counters;
    if (result.helpersStats && result.helpersStats.counters) return result.helpersStats.counters;
    if (result.perf && result.perf.counters) return result.perf.counters;
    if (result._debug && result._debug.perfStats && result._debug.perfStats.counters)
      return result._debug.perfStats.counters;
    if (result.stats && result.stats.perfStats && result.stats.perfStats.counters)
      return result.stats.perfStats.counters;
    return null;
  }

  const res = runa11yCoreOnHtml(html, { engineOptions });
  const ruleTimings = extractRuleTimings(res);

  const ms = hrMs(t0);
  gcIfAvailable();
  const memAfter = process.memoryUsage();

  function getRuleCount(r) {
    if (!r) return 0;
    if (Array.isArray(r.checksResults)) return r.checksResults.length;
    if (Array.isArray(r.rules)) return r.rules.length;
    if (Array.isArray(r.results)) return r.results.length;
    if (Array.isArray(r.outcomes)) return r.outcomes.length;
    if (Array.isArray(r.violations)) return r.violations.length;
    if (r.byRuleId && typeof r.byRuleId === 'object') return Object.keys(r.byRuleId).length;
    return 0;
  }

  const perfCounters = extractPerfCounters(res);

  const out = {
    ms,
    rules: getRuleCount(res),
    mem: {
      heapUsedDelta: memAfter.heapUsed - memBefore.heapUsed,
      rssDelta: memAfter.rss - memBefore.rss
    },
    hasPerfCounters: Boolean(perfCounters),
    perfCounters: perfCounters || null,
    ruleTimings: ruleTimings || null
  };

  process.stdout.write(JSON.stringify(out));
}

function topRuleTimings(ruleTimings, limit) {
  const entries = [];
  const obj = ruleTimings && typeof ruleTimings === 'object' ? ruleTimings : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'number' && v > 0) entries.push([k, v]);
  }
  entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const n = Math.max(0, Number(limit) || 0) || 15;
  return entries
    .slice(0, n)
    .map(([ruleId, ms]) => ({ ruleId, ms: Number(ms.toFixed ? ms.toFixed(2) : ms) }));
}

function parentMain() {
  const args = parseArgv(process.argv);

  let htmlLabel;
  let html;

  if (args.html) {
    const p = path.resolve(process.cwd(), args.html);
    html = fs.readFileSync(p, 'utf8');
    htmlLabel = p;
  } else {
    const gen = String(args.generated || 'big')
      .trim()
      .toLowerCase();

    let variant = 'bigTransparent'; // legacy default
    if (gen === 'bigopaque') variant = 'bigOpaque';
    else if (gen === 'bigtransparent' || gen === 'big') variant = 'bigTransparent';
    else if (gen === 'contrastopaque') variant = 'contrastOpaque';
    else if (gen === 'contrasttransparent') variant = 'contrastTransparent';

    html = makeBigHtml({ variant });
    htmlLabel = `(generated:${variant})`;
  }

  const engineOptions = {
    includeShadowDom: false,
    perfStats: true,
    profileRules: args.profileRules
  };

  console.log('=== engine perf bench ===');
  console.log(`html: ${htmlLabel}`);
  console.log(`warmup: ${args.warmup}`);
  console.log(`iters: ${args.iters}`);
  console.log(`profileRules: ${args.profileRules ? 'yes' : 'no'}`);
  console.log('');

  const payload = {
    html,
    engineOptions,
    exposeGc: args.exposeGc
  };

  // Warmup (ignored in stats)
  for (let i = 0; i < args.warmup; i++) {
    runWorkerOnce(payload);
  }

  const runs = [];
  for (let i = 0; i < args.iters; i++) {
    const r = runWorkerOnce(payload);
    runs.push(r);
    console.log(
      `iter ${i + 1}/${args.iters}: ${r.ms.toFixed(2)}ms, ` +
        `heapΔ=${fmtMb(r.mem.heapUsedDelta)}, rssΔ=${fmtMb(r.mem.rssDelta)}`
    );
  }

  const times = runs
    .map((r) => r.ms)
    .slice()
    .sort((a, b) => a - b);
  const rules = runs[0] ? runs[0].rules : 0;

  const avg = times.reduce((a, b) => a + b, 0) / (times.length || 1);
  const min = times[0] || 0;
  const max = times[times.length - 1] || 0;
  const p50 = percentile(times, 50);
  const p95 = percentile(times, 95);

  console.log('\n=== totals ===');
  console.log(`rules: ${rules}`);
  console.log(`avg: ${avg.toFixed(2)}ms`);
  console.log(`min: ${min.toFixed(2)}ms`);
  console.log(`p50: ${p50.toFixed(2)}ms`);
  console.log(`p95: ${p95.toFixed(2)}ms`);
  console.log(`max: ${max.toFixed(2)}ms`);

  const perfCounters = runs.find((r) => r && r.perfCounters)
    ? runs.find((r) => r && r.perfCounters).perfCounters
    : null;
  if (perfCounters) {
    console.log('\n=== perf counters (one run) ===');
    console.log(`top counters (limit ${args.top}):`, topCounters(perfCounters, args.top));
  } else {
    console.log('\n=== perf counters ===');
    console.log('(not available on engine result shape)');
  }

  const one = runs.find((r) => r && r.ruleTimings);
  if (one && one.ruleTimings) {
    console.log('\n=== rule timings (one run) ===');
    console.log(`top rules (limit ${args.top}):`, topRuleTimings(one.ruleTimings, args.top));
  } else {
    console.log('\n=== rule timings ===');
    console.log(
      '(not available; enable by instrumenting runDomRulesOnHtml and returning ruleTimings)'
    );
  }

  const heapDeltas = runs
    .map((r) => r.mem.heapUsedDelta)
    .slice()
    .sort((a, b) => a - b);
  const rssDeltas = runs
    .map((r) => r.mem.rssDelta)
    .slice()
    .sort((a, b) => a - b);
  const heapP50 = percentile(heapDeltas, 50);
  const rssP50 = percentile(rssDeltas, 50);

  console.log('\n=== memory (process-per-iter) ===');
  console.log(`heapUsed p50Δ: ${fmtMb(heapP50)}`);
  console.log(`rss p50Δ:      ${fmtMb(rssP50)}`);

  if (!rules) {
    console.log(
      '\n(note: rule count detected as 0; engine result may not expose checks/results arrays)'
    );
  }

  if (!args.html) {
    console.log('\n=== generated fixture variants ===');
    console.log(
      'Legacy/broad: --generated=bigTransparent (or --generated=big), --generated=bigOpaque'
    );
    console.log('Contrast-focused: --generated=contrastTransparent, --generated=contrastOpaque');
    console.log(
      '(Contrast-focused variants reduce <img> count so img-alt-quality does not dominate.)'
    );
  }
}

function main() {
  const isWorker = process.argv.some((a) => a === '--worker=1');
  if (isWorker) return workerMain();
  return parentMain();
}

if (require.main === module) {
  main();
} else {
  // Loaded as a module (e.g. by an external reference-engine comparison bench) rather than run
  // directly: expose the fixture generator instead of executing the CLI.
  module.exports = { makeBigHtml };
}
