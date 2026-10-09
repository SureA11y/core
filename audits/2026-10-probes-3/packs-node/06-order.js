'use strict';
// Determinism: two valid packs in either order, plus an invalid one at
// different positions.
const { scan, quiet, base, rule, strip, report } = require('./lib.js');
const assert = require('assert');
const mk = (n) => base({ name: n, namespace: n,
  rules: [rule(`${n}-r`, { runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }), meta: { wcagSc: ['1.3.1'], tags: ['wcag2a'] } })],
  dictionaries: { en: { [`${n}R_title`]: n } } });
const bad1 = base({ name: 'zbad', namespace: 'zbad', core: '^99.0.0' });
const bad2 = base({ name: 'abad', namespace: 'abad', core: 'nope' });
const cmp = (label, x, y) => {
  try { assert.deepStrictEqual(strip(x), strip(y)); report(label, 'identical'); }
  catch (e) { report(label, 'DIFFER: ' + e.message.slice(0, 900)); }
};
const r1 = quiet(() => scan({ packs: [mk('a'), mk('b'), bad1, bad2] })).r;
const r2 = quiet(() => scan({ packs: [bad2, mk('b'), bad1, mk('a')] })).r;
cmp('[a,b,zbad,abad] vs [abad,b,zbad,a]', r1, r2);
report('engine.packs / skipped order 1', [r1.engine.packs, r1.skippedPacks.map((s) => s.name)]);
report('engine.packs / skipped order 2', [r2.engine.packs, r2.skippedPacks.map((s) => s.name)]);
const w131 = (r) => (r.rulesResults.find((x) => x.ruleId === 'wcag-1.3.1-info-and-relationships') || {}).data.details.checksIds.slice(-3);
report('wcag 1.3.1 rollup members tail (1 / 2)', [w131(r1), w131(r2)]);
// names compare by code unit: 'B' vs 'a'
const r3 = quiet(() => scan({ packs: [mk('a'), { ...mk('b'), name: 'B' }] })).r;
report('sort with uppercase names', r3.engine.packs);
