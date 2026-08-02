'use strict';

/**
 * dom-helpers-perf-bench.js
 *
 * Run:
 *   node --expose-gc dom-helpers-perf-bench.js
 *   node --expose-gc dom-helpers-perf-bench.js --json
 *   node --expose-gc dom-helpers-perf-bench.js --buttons 5000 --iters 15
 *
 * Notes:
 * - Deterministic workload (no randomness).
 * - Measures cold vs warm behavior using the same helper instance (per-run caches).
 */

const { JSDOM } = require('jsdom');
const { createDomHelpers } = require('../src/core/dom-helpers');

function parseArgs(argv) {
  const out = { json: false, buttons: 2000, iters: 11, includeShadowDom: false, top: 15 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--includeShadowDom') out.includeShadowDom = true;
    else if (a === '--buttons') out.buttons = Math.max(0, Number(argv[++i] || out.buttons) | 0);
    else if (a === '--iters') out.iters = Math.max(3, Number(argv[++i] || out.iters) | 0);
    else if (a === '--top') out.top = Math.max(0, Number(argv[++i] || out.top) | 0);
  }
  // prefer odd iters for median
  if (out.iters % 2 === 0) out.iters += 1;
  return out;
}

function hrMs(startNs) {
  const end = process.hrtime.bigint();
  return Number(end - startNs) / 1e6;
}

function gcIfAvailable() {
  try {
    if (typeof global.gc === 'function') global.gc();
  } catch (_) {
    // no-throws
  }
}

function median(values) {
  const v = values.slice().sort((a, b) => a - b);
  return v[(v.length / 2) | 0];
}

function mean(values) {
  let s = 0;
  for (const x of values) s += x;
  return values.length ? s / values.length : 0;
}

function makeDom(buttonCount) {
  const buttonsHtml = Array.from({ length: buttonCount })
    .map((_, i) => `<button id="b${i}" aria-label="B${i}">B${i}</button>`)
    .join('');

  const html = `<!doctype html>
<html>
  <body>
    <label for="i1">First</label>
    <input id="i1" />
    <div id="d1" aria-labelledby="l1 l2"></div>
    <span id="l1">Hello</span>
    <span id="l2">World</span>
    ${buttonsHtml}
  </body>
</html>`;

  return new JSDOM(html);
}

function benchOnce(helpers, document) {
  const buttons = Array.from(document.querySelectorAll('button'));
  const input = document.getElementById('i1');
  const div = document.getElementById('d1');

  const start = process.hrtime.bigint();
  for (const b of buttons) {
    helpers.buildSelector(b);
    helpers.getOuterHtmlSnippet(b);
    helpers.getAccessibleNameInfo(b);
    helpers.getFocusableInfo(b);
  }
  helpers.getAccessibleNameInfo(input);
  helpers.getAccessibleNameInfo(div);
  return hrMs(start);
}

function getCounterSnapshot(helpers) {
  try {
    const s = helpers.getPerfStats && helpers.getPerfStats();
    return s && s.counters ? { ...s.counters } : {};
  } catch (_) {
    return {};
  }
}

function topCounters(counters, limit) {
  const entries = [];
  for (const k of Object.keys(counters || {})) {
    const v = counters[k];
    if (typeof v === 'number' && v) entries.push([k, v]);
  }
  // Deterministic order: value desc, key asc
  entries.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const out = [];
  const n = Math.max(0, Number(limit) || 0) || 15;
  for (let i = 0; i < entries.length && i < n; i++) {
    out.push({ key: entries[i][0], value: entries[i][1] });
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);

  const dom = makeDom(args.buttons);
  const { window } = dom;
  const { document } = window;

  const helpers = createDomHelpers({
    window,
    document,
    root: document,
    includeShadowDom: args.includeShadowDom,
    excludeSelectors: null,
    perfStats: true
  });

  // --- Cold run (first time through caches) ---
  gcIfAvailable();
  if (helpers.resetPerfStats) helpers.resetPerfStats();
  const coldMs = benchOnce(helpers, document);
  const coldCounters = getCounterSnapshot(helpers);

  // --- Warm runs (repeat same workload; expect hits) ---
  const warmTimes = [];
  const warmCountersLast = {};
  for (let i = 0; i < args.iters; i++) {
    gcIfAvailable();
    if (helpers.resetPerfStats) helpers.resetPerfStats();
    warmTimes.push(benchOnce(helpers, document));
    const snap = getCounterSnapshot(helpers);
    // keep the last snapshot (useful for hit ratios)
    for (const k of Object.keys(snap)) warmCountersLast[k] = snap[k];
  }

  function ratio(counters, hitKey, missKey) {
    const hit = counters[hitKey] || 0;
    const miss = counters[missKey] || 0;
    const total = hit + miss;
    return total ? hit / total : 0;
  }

  const summary = {
    params: args,
    cold: {
      ms: coldMs,
      counters: coldCounters,
      topCounters: topCounters(coldCounters, args.top)
    },
    warm: {
      msMedian: median(warmTimes),
      msMean: mean(warmTimes),
      msAll: warmTimes,
      countersLast: warmCountersLast,
      topCountersLast: topCounters(warmCountersLast, args.top),
      hitRatios: {
        selector: ratio(warmCountersLast, 'selector.hit', 'selector.miss'),
        outerHtml: ratio(warmCountersLast, 'outerHtml.hit', 'outerHtml.miss'),
        focusability: ratio(warmCountersLast, 'focusability.hit', 'focusability.miss')
      }
    }
  };

  if (args.json) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    return;
  }

  console.log(`cold: ${summary.cold.ms.toFixed(2)}ms`);
  console.log(
    `warm median: ${summary.warm.msMedian.toFixed(2)}ms (mean ${summary.warm.msMean.toFixed(2)}ms, iters ${args.iters})`
  );
  console.log('warm hit ratios:', {
    selector: summary.warm.hitRatios.selector.toFixed(3),
    outerHtml: summary.warm.hitRatios.outerHtml.toFixed(3),
    focusability: summary.warm.hitRatios.focusability.toFixed(3)
  });
  console.log('top counters (cold):', summary.cold.topCounters);
  console.log('top counters (warm last):', summary.warm.topCountersLast);
  console.log('counters (cold):', summary.cold.counters);
  console.log('counters (warm last):', summary.warm.countersLast);
}

main();
