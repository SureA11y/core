'use strict';
// Validates real results (fixtures x option combinations) against
// OUTPUT_SCHEMA.md (v.js), and saves a sample of each combination for the
// TypeScript check (05b).
const fs = require('fs');
const path = require('path');
const h = require('./h.js');
const { validate } = require('./v.js');
const { main } = h.load();
const pkgVersion = require(h.ROOT + '/package.json').version;
const FIX = ['all-pass.html', 'contrast-all-scenarios.html', 'duplicate-id-all-scenarios.html', 'aria-hidden-focus-all-scenarios.html', 'landmark-unique-all-scenarios.html',
  'form-control-programmatic-label-all-scenarios.html', 'img-alt-present-all-scenarios.html', 'label-in-name-all-scenarios.html', 'manual-review-all-scenarios.html', 'region-all-scenarios.html', 'heading-order-all-scenarios.html', 'page-title-present-all-scenarios.html'];
const customOk = { id: 'org-ok', meta: { title: 'Org ok', tags: ['wcag111', 'wcag2a'], wcagSc: ['1.1.1'] }, runInPage: "(ctx) => ({ outcome: 'fail', occurrences: ctx.helpers.queryAllSmart('img').slice(0,2).map((el) => ({ __node: el, summary: 'org' })) })" };
const customBad = { id: 'org-bad', runInPage: 42 };
const COMBOS = [
  ['default', {}, null, null],
  ['ja', { locale: 'ja' }, null, null],
  ['en301549-v3.2.1', { profile: 'en301549-v3.2.1' }, null, null],
  ['mappings all', { mappings: 'en301549' }, null, null],
  ['findings', { output: { detail: 'findings' } }, null, null],
  ['no selector/html', { output: { includeSelector: false, includeHtml: false } }, null, null],
  ['wcag 2.0', { wcagVersion: '2.0' }, null, null],
  ['wcag2.1A+bp', {}, { wcag: { version: '2.1', level: 'A' }, bestPractices: true }, null],
  ['508+bp', { profile: 'section508' }, { bestPractices: true }, null],
  ['scope main', {}, null, 'main'],
  ['custom', { customRules: [customOk, customBad] }, null, null],
  ['exclude img', { excludeSelectors: 'img, [role=img]' }, null, null],
  ['generic policy', { policyContract: 'generic' }, null, null],
  ['composite id', {}, ['wcag-1.1.1-non-text-content'], null],
  ['best-practice tag', {}, { tags: ['best-practice'] }, null],
  ['auditorAssist', { contrast: { mode: 'auditorAssist' } }, null, null],
  ['hidden', { includeHiddenElements: true }, null, null],
  ['perf', { perfStats: true, profileRules: true }, null, null],
  ['ja findings profile', { locale: 'ja', output: { detail: 'findings' }, profile: 'en301549-v4.1.1' }, null, null],
  ['unmatched scope', {}, null, ['#nope', 'main']]
];
const problems = new Map();
const samples = {};
let n = 0;
for (const f of FIX) {
  const html = h.fixture(f);
  for (const [name, eo, ro, ctx] of COMBOS) {
    const dom = h.setDom(html);
    const r = h.capture(() => main.runDomRulesInPage('https://example.test/' + f, ctx, eo, ro));
    n++;
    if (r.error) { const k = `${name}: THROWS ${r.error.message.slice(0, 100)}`; problems.set(k, (problems.get(k) || []).concat(f)); continue; }
    for (const pr of validate(r.value, { doc: dom.window.document, pkgVersion })) {
      const k = `${name}: ${pr}`;
      problems.set(k, (problems.get(k) || []).concat(f));
    }
    if (!samples[name] || f === 'contrast-all-scenarios.html') samples[name] = r.value;
  }
}
fs.writeFileSync(path.join(__dirname, 'out-05-samples.json'), JSON.stringify(samples)); // read by 05b-types.js (about 5 MB; not kept)
const lines = [...problems.entries()].map(([k, fs]) => `${fs.length}x ${k}  [${[...new Set(fs)].slice(0, 3).join(', ')}]`).sort();
fs.writeFileSync(path.join(__dirname, 'out-05.txt'), lines.join('\n') + '\nscans ' + n + '\n');
console.log(lines.length, 'problem kinds;', n, 'scans');
process.exit(0);
