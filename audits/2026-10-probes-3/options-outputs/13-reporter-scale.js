'use strict';
// Reporters on a result with N fail occurrences (copied from a real one, each
// made distinct): time, output size and heap growth, for N = 12.5k, 25k, 50k.
const h = require('./h.js');
const { main, sub } = h.load();
const R = { sarif: sub('sarif'), junit: sub('junit'), report: sub('report'), earl: sub('earl'), baseline: sub('baseline') };
h.setDom('<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"><button></button></main></body></html>');
const base = main.runDomRulesInPage('https://e.test/', null, { timestamp: '2026-10-09T00:00:00Z' }, null);
const img = base.checksResults.find((c) => c.ruleId === 'img-alt-present');
const btn = base.checksResults.find((c) => c.ruleId === 'button-name-present');
function make(n) {
  const r = structuredClone(base);
  const half = n / 2;
  for (const [id, src] of [['img-alt-present', img], ['button-name-present', btn]]) {
    const c = r.checksResults.find((x) => x.ruleId === id);
    const o = src.occurrences[0];
    c.occurrences = Array.from({ length: half }, (_, i) => ({ ...o, selector: `#e${i}`, html: o.html.replace('>', ` id="e${i}">`) }));
  }
  return r;
}
for (const n of [12500, 25000, 50000]) {
  const r = make(n);
  const entries = R.baseline.buildBaselineEntries(r);
  const row = [];
  for (const [name, fn] of Object.entries({
    sarif: () => R.sarif.renderSarifReport(r),
    sarifWithBaseline: () => R.sarif.renderSarifReport(r, { baselineEntries: entries }),
    junit: () => R.junit.renderJunitReport(r),
    report: () => R.report.renderHtmlReport(r),
    earl: () => JSON.stringify(R.earl.renderEarlReport(r)),
    baselineMatch: () => JSON.stringify(R.baseline.matchBaseline(r, entries))
  })) {
    global.gc && global.gc();
    const m0 = process.memoryUsage().heapUsed;
    const t0 = process.hrtime.bigint();
    const out = fn();
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    const m1 = process.memoryUsage().heapUsed;
    row.push(`${name} ${ms.toFixed(0)}ms ${(out.length / 1e6).toFixed(1)}MB +${((m1 - m0) / 1e6).toFixed(0)}MBheap`);
  }
  console.log(`N=${n}: ` + row.join(' | '));
}
process.exit(0);
