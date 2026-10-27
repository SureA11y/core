'use strict';
// Results stored by 1.10.0 (as JSON) fed to main's reporters: nothing may
// throw or render "undefined"/"NaN"; and main's baseline of a 1.10.0 result
// matches the 1.10.0 baseline of it.
const fs = require('fs');
const path = require('path');
const h = require('./h.js');
const old = h.load(h.OLD_CORE);
const cur = h.load();
const R = Object.fromEntries(['sarif', 'junit', 'report', 'earl', 'baseline'].map((n) => [n, cur.sub(n)]));
const OR = Object.fromEntries(['sarif', 'junit', 'report', 'earl', 'baseline'].map((n) => [n, old.sub(n)]));
const files = ['img-alt-present-all-scenarios.html', 'duplicate-id-all-scenarios.html', 'contrast-all-scenarios.html', 'manual-review-all-scenarios.html', 'all-pass.html', 'label-in-name-all-scenarios.html'];
const opts = [{}, { profile: 'en301549-v3.2.1' }, { mappings: 'en301549', locale: 'de' }, { locale: 'ja', wcagVersion: '2.0' }];
const issues = [];
for (const f of files) for (const eo of opts) {
  h.setDom(h.fixture(f));
  const res = JSON.parse(JSON.stringify(old.main.runDomRulesInPage('file:///tmp/x y/' + f, null, { timestamp: '2026-10-06T00:00:00Z', ...eo }, null)));
  const tag = f + ' ' + JSON.stringify(eo);
  for (const [n, fn] of Object.entries({ sarif: (r) => R.sarif.renderSarifReport(r), junit: (r) => R.junit.renderJunitReport(r), earl: (r) => JSON.stringify(R.earl.renderEarlReport(r)), report: (r) => R.report.renderHtmlReport(r) })) {
    const out = h.capture(() => fn(res));
    if (out.error) { issues.push(`${tag} ${n} THROWS ${out.error.message}`); continue; }
    const s = n === 'report' ? out.value.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '') : out.value;
    for (const bad of ['undefined', 'NaN', '[object Object]']) if (s.includes(bad)) issues.push(`${tag} ${n}: contains "${bad}" near ${JSON.stringify(s.slice(Math.max(0, s.indexOf(bad) - 80), s.indexOf(bad) + 40))}`);
    if (out.logs.length) issues.push(`${tag} ${n}: logs ${out.logs.join('|').slice(0, 120)}`);
  }
  // Baselines written by either version from the same stored result agree.
  const a = JSON.stringify(R.baseline.buildBaselineEntries(res)), b = JSON.stringify(OR.baseline.buildBaselineEntries(res));
  if (a !== b) issues.push(`${tag}: baseline entries differ between versions for the same result`);
  // Old SARIF vs new SARIF on the same stored result: result counts and levels.
  const so = JSON.parse(OR.sarif.renderSarifReport(res)).runs[0], sn = JSON.parse(R.sarif.renderSarifReport(res)).runs[0];
  const lv = (run) => run.results.map((x) => x.ruleId + ':' + x.level).sort().join(',');
  if (lv(so) !== lv(sn)) issues.push(`${tag}: SARIF results differ old ${so.results.length} vs new ${sn.results.length}`);
  const jo = OR.junit.renderJunitReport(res), jn = R.junit.renderJunitReport(res);
  const cnt = (x) => (x.match(/<testsuites[^>]*>/) || [''])[0];
  if (cnt(jo) !== cnt(jn)) issues.push(`${tag}: JUnit totals old ${cnt(jo)} new ${cnt(jn)}`);
}
console.log(issues.length ? issues.join('\n') : 'no issues');
process.exit(0);
