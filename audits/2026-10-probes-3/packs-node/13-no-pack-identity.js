'use strict';
// No packs given in different ways must give identical results; and the
// current tree vs the published 1.10.0 on fixture pages (no packs): which
// result keys, rule ids and outcomes differ.
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { scan, quiet, strip, report, ROOT, main } = require('./lib.js');
const core = require(path.join(ROOT, 'src/core.js'));
const oldPath = path.join(__dirname, '_old/package/src/index.js');
const old = fs.existsSync(oldPath) ? require(oldPath) : null;

const cmp = (label, x, y) => {
  try { assert.deepStrictEqual(strip(x), strip(y)); return report(label, 'identical'); }
  catch (e) { return report(label, 'DIFFER: ' + e.message.slice(0, 700)); }
};
const ref = quiet(() => scan({})).r;
for (const [label, opts] of [['packs: []', { packs: [] }], ['packs: undefined', { packs: undefined }], ['packs: null', { packs: null }],
  ['packs: {} (not an array)', { packs: {} }], ['packs: "acme" (string)', { packs: 'acme' }]]) {
  const x = quiet(() => scan(opts));
  if (x.error) { report(label, 'THROWS ' + x.error.message); continue; }
  cmp(label + ' vs no option', ref, x.r);
  if (x.warnings.length) report(label + ' warnings', x.warnings);
}
for (const [label, opts] of [['packs: {} strict', { packs: {}, strictOptions: true }], ['packs: "acme" strict', { packs: 'acme', strictOptions: true }]]) {
  const x = quiet(() => scan(opts));
  report(label, x.error ? 'throws: ' + x.error.message.slice(0, 200) : 'no error');
}
// All packs skipped: is the result otherwise identical to core's?
const bad = { name: 'bad', version: '1.0.0', namespace: 'bad', core: '^99.0.0' };
for (const opts of [{}, { profile: 'wcag22-aa' }, { profile: 'en301549-v3.2.1' }, { mappings: ['en301549'] }, { locale: 'fr' }]) {
  const a = quiet(() => scan(opts)).r;
  const b = quiet(() => scan({ ...opts, packs: [bad] })).r;
  const b2 = { ...b, engine: { ...b.engine } };
  delete b2.engine.packs; delete b2.skippedPacks;
  cmp('only skipped packs vs none, ' + JSON.stringify(opts), a, b2);
}
// Catalog functions with an all-skipped pack.
const c1 = main.getChecksCatalog();
const c2 = quiet(() => main.getChecksCatalog({ packs: [bad] })).r;
cmp('getChecksCatalog none vs [skipped pack]', c1, c2);
cmp('getRulesCatalog none vs [skipped pack]', main.getRulesCatalog(), quiet(() => main.getRulesCatalog({ packs: [bad] })).r);

if (!old) { console.log('no _old package; skipping 1.10.0 comparison'); process.exit(0); }
// Current vs published 1.10.0 on fixture pages.
const fixtures = ['all-pass.html', 'img-alt-present-all-scenarios.html', 'aria-allowed-attr-all-scenarios.html', 'button-name-present-all-scenarios.html', 'landmark-unique-all-scenarios.html'];
const keyDiff = (a, b) => ({ onlyNew: Object.keys(a).filter((k) => !(k in b)), onlyOld: Object.keys(b).filter((k) => !(k in a)) });
for (const f of fixtures) {
  const file = path.join(ROOT, 'tests/fixtures', f);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const n = quiet(() => scan({}, { html })).r;
  const o = quiet(() => scan({}, { html, impl: old })).r;
  const oc = Object.fromEntries(o.checksResults.map((c) => [c.ruleId, c.outcome]));
  const nc = Object.fromEntries(n.checksResults.map((c) => [c.ruleId, c.outcome]));
  const outcomeDiffs = Object.keys({ ...oc, ...nc }).filter((id) => oc[id] !== nc[id]).map((id) => `${id}: ${oc[id]} -> ${nc[id]}`);
  const ckNew = n.checksResults[0], ckOld = o.checksResults[0];
  report(`1.10.0 vs HEAD ${f}`, {
    topKeys: keyDiff(n, o), engineKeys: keyDiff(n.engine, o.engine), checkKeys: keyDiff(ckNew, ckOld),
    ruleCount: [o.checksResults.length, n.checksResults.length], rollupCount: [o.rulesResults.length, n.rulesResults.length],
    outcomeDiffs
  });
}
