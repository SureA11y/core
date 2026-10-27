'use strict';
// output.detail 'findings' must report as the full result does: render every
// reporter from a full and a compact scan of the same page with the same
// options, and diff.
const h = require('./h.js');
const { main, sub } = h.load();
const R = { sarif: sub('sarif'), junit: sub('junit'), report: sub('report'), earl: sub('earl'), baseline: sub('baseline') };
const pack = require(h.ROOT + '/tests/fixtures/packs/sample.js');
const custom = { id: 'org-pass', meta: { title: 'Org pass rule', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'], helpUrl: 'https://example.org/help' }, runInPage: "() => ({ outcome: 'pass', occurrences: [] })" };
const html = h.fixture('img-alt-present-all-scenarios.html');
const sets = {
  plain: {},
  ja: { locale: 'ja' },
  'de-AT': { locale: 'de-AT' },
  profile: { profile: 'en301549-v3.2.1' },
  mappings: { mappings: ['en301549:V4.1.1'] },
  wcag20: { wcagVersion: '2.0' },
  custom: { customRules: [custom] },
  messages: { locale: 'xx', messages: { xx: { img_altPresent_title: 'XX title' } } },
  pack: { packs: [pack] }
};
const norm = (s) => String(s);
for (const [name, eo] of Object.entries(sets)) {
  const base = { timestamp: '2026-10-09T00:00:00Z', ...eo };
  h.setDom(html);
  const full = h.capture(() => main.runDomRulesInPage('https://example.test/', null, base, null));
  h.setDom(html);
  const comp = h.capture(() => main.runDomRulesInPage('https://example.test/', null, { ...base, output: { detail: 'findings' } }, null));
  if (full.error || comp.error) { console.log(name, 'ERR', (full.error || comp.error).message); continue; }
  const diffs = [];
  for (const [rn, fn] of [['sarif', (r) => R.sarif.renderSarifReport(r)], ['junit', (r) => R.junit.renderJunitReport(r)], ['earl', (r) => JSON.stringify(R.earl.renderEarlReport(r))], ['report', (r) => R.report.renderHtmlReport(r)], ['baseline', (r) => JSON.stringify(R.baseline.buildBaselineEntries(r))]]) {
    const a = norm(fn(full.value)), b = norm(fn(comp.value));
    if (a !== b) {
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      diffs.push(`${rn}@${i}: full=${JSON.stringify(a.slice(Math.max(0, i - 80), i + 80))}\n      compact=${JSON.stringify(b.slice(Math.max(0, i - 80), i + 80))}`);
    }
  }
  // getMargins and the catalog-backed fields
  console.log(`## ${name}: ${diffs.length ? diffs.length + ' reporter(s) differ' : 'identical'}`);
  for (const d of diffs) console.log('  ' + d);
}
process.exit(0);
