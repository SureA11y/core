'use strict';
// Baselines: a 1.10.0 baseline applied to main's results on every fixture,
// stability under DOM changes that should not matter, collisions, and
// malformed baseline input.
const fs = require('fs');
const path = require('path');
const h = require('./h.js');
const cur = h.load();
const old = h.load(h.OLD_CORE);
const B = cur.sub('baseline');
const OB = old.sub('baseline');

console.log('## 1. 1.10.0 baseline vs main results, every fixture');
const files = fs.readdirSync(path.join(h.ROOT, 'tests/fixtures')).filter((f) => f.endsWith('.html'));
const byRule = {};
let tot = { fail: 0, known: 0, new: 0, stale: 0 };
for (const f of files) {
  const html = h.fixture(f);
  h.setDom(html);
  const o = h.capture(() => old.main.runDomRulesInPage('https://example.test/', null, { wcagVersion: '2.1' }, null)).value;
  h.setDom(html);
  const c = h.capture(() => cur.main.runDomRulesInPage('https://example.test/', null, { wcagVersion: '2.1' }, null)).value;
  const entries = OB.buildBaselineEntries(o);
  const m = B.matchBaseline(c, entries);
  tot.fail += m.totalFail; tot.known += m.knownCount; tot.new += m.newCount; tot.stale += m.staleCount;
  for (const n of m.newOccurrences) {
    const k = n.ruleId + ' ' + n.reasonCode;
    byRule[k] = byRule[k] || { new: 0, files: new Set(), sample: n.html.slice(0, 120) };
    byRule[k].new++; byRule[k].files.add(f);
  }
  // Stale entries per rule
  const keys = new Map();
  for (const e of entries) { const k = B.computeBaselineKey(e.ruleId, e.reasonCode, e.html); keys.set(k, (keys.get(k) || 0) + 1); }
  for (const cc of c.checksResults) if (cc.outcome === 'fail') for (const oc of cc.occurrences) {
    if (oc.occurrenceOutcome && oc.occurrenceOutcome !== 'fail') continue;
    const k = B.computeBaselineKey(cc.ruleId, B.getReasonCode(oc), oc.html); if (keys.get(k)) keys.set(k, keys.get(k) - 1);
  }
  for (const [k, n] of keys) if (n > 0) { const [rid, rc, ht] = k.split('\u0000'); const kk = 'STALE ' + rid + ' ' + rc; byRule[kk] = byRule[kk] || { new: 0, files: new Set(), sample: ht.slice(0, 120) }; byRule[kk].new += n; byRule[kk].files.add(f); }
}
console.log(JSON.stringify(tot));
for (const [k, v] of Object.entries(byRule).sort()) console.log(`  ${k}: ${v.new} in ${[...v.files].slice(0, 3).join(', ')}  e.g. ${JSON.stringify(v.sample)}`);

console.log('\n## 2. stability under DOM changes');
function failsOf(html, ro) {
  h.setDom(html);
  return cur.main.runDomRulesInPage('https://example.test/', null, { wcagVersion: '2.1' }, ro);
}
const variants = {
  base: '<main><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn"><svg aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>',
  attrOrder: '<main><p>Intro</p><div data-x="1" class="a b card"><img width="10" class="y z" src="a.png"><a href="/x"></a><button class="btn" type="button"><svg aria-hidden="true"></svg></button><input id="f1" type="text"></div></main>',
  siblingBefore: '<main><p>New paragraph</p><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn"><svg aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>',
  whitespaceBetween: '<main>\n  <p>Intro</p>\n  <div class="card b a" data-x="1">\n    <img src="a.png" class="z y" width="10">\n    <a href="/x"></a>\n    <button type="button" class="btn"><svg aria-hidden="true"></svg></button>\n    <input type="text" id="f1">\n  </div>\n</main>',
  classWhitespace: '<main><p>Intro</p><div class=" card  b a " data-x="1"><img src="a.png" class=" z  y " width="10"><a href="/x"></a><button type="button" class="btn "><svg aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>',
  singleQuotes: "<main><p>Intro</p><div class='card b a' data-x='1'><img src='a.png' class='z y' width=10><a href='/x'></a><button type='button' class='btn'><svg aria-hidden='true'></svg></button><input type='text' id='f1'></div></main>",
  innerWhitespace: '<main><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn">\n  <svg aria-hidden="true"></svg>\n</button><input type="text" id="f1"></div></main>',
  svgAttrOrder: '<main><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn"><svg focusable="false" aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>',
  parentStyle: '<main style="padding:1px"><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn"><svg aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>',
  entityVsLiteral: '<main><p>Intro</p><div class="card b a" data-x="1"><img src="a.png" class="z y" width="10"><a href="/x"></a><button type="button" class="btn"><svg aria-hidden="true"></svg></button><input type="text" id="f1"></div></main>'
};
const doc = (b) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${b}</body></html>`;
const baseRes = failsOf(doc(variants.base), null);
const baseEntries = B.buildBaselineEntries(baseRes);
console.log('  base fail entries:', baseEntries.length, baseEntries.map((e) => e.ruleId).join(' '));
for (const [name, b] of Object.entries(variants)) {
  if (name === 'base') continue;
  const m = B.matchBaseline(failsOf(doc(b), null), baseEntries);
  console.log(`  ${name.padEnd(18)} total ${m.totalFail} known ${m.knownCount} new ${m.newCount} stale ${m.staleCount}` + (m.newCount ? '  new: ' + m.newOccurrences.map((n) => n.ruleId + ' ' + JSON.stringify(n.html.slice(0, 80))).join(' ; ') : ''));
}

console.log('\n## 3. collisions');
// Two different elements whose first 2,000 characters match.
const long = 'x'.repeat(2100);
const a = doc(`<button aria-label="" data-a="${long}1"></button><button aria-label="" data-a="${long}2"></button>`);
const ra = failsOf(a, ['button-name-present']);
const occ = ra.checksResults[0].occurrences;
console.log('  two buttons differing after 2,000 chars: occurrences', occ.length, 'same html:', occ[0] && occ[1] && occ[0].html === occ[1].html,
  'same key:', occ.length === 2 && B.computeBaselineKey('b', 'r', occ[0].html) === B.computeBaselineKey('b', 'r', occ[1].html));
// Separator injection: a reasonCode/ruleId with NUL can't be page content; html with \u0000 is replaced by the parser.
console.log('  key("a\\u0000b","c","d") === key("a","b\\u0000c","d"):', B.computeBaselineKey('a\u0000b', 'c', 'd') === B.computeBaselineKey('a', 'b\u0000c', 'd'));
// Frame path joined with \u0001: ['a\u0001b'] vs ['a','b']
console.log('  frame ["a\\u0001b"] vs ["a","b"] same key:', B.computeBaselineKey('r', 'c', 'h', ['a\u0001b']) === B.computeBaselineKey('r', 'c', 'h', ['a', 'b']));
// Normalised html: different attribute values that normalise the same?
const n1 = B.computeBaselineKey('r', 'c', '<img alt="a b" class="x">'), n2 = B.computeBaselineKey('r', 'c', '<img class="x" alt="a b">');
console.log('  attr-order equivalence holds:', n1 === n2);
const n3 = B.computeBaselineKey('r', 'c', '<p class="a b">'), n4 = B.computeBaselineKey('r', 'c', '<p class="b a">'), n5 = B.computeBaselineKey('r', 'c', '<p class="a a b">');
console.log('  class sort equal:', n3 === n4, ' duplicate class token same as without:', n3 === n5);
// Normalization in text content that looks like a tag (escaped in outerHTML, so not reachable), and in attribute values containing '<x b a>'
const n6 = B.computeBaselineKey('r', 'c', '<p title="<i b a>">'), n7 = B.computeBaselineKey('r', 'c', '<p title="<i a b>">');
console.log('  tag-like text inside an attribute value is not reordered (n6!==n7):', n6 !== n7);

console.log('\n## 4. malformed baselines');
const res = failsOf(doc(variants.base), null);
const file = { version: 1, generatedAt: 'x', entries: B.buildBaselineEntries(res) };
const cases = {
  'whole file object instead of entries': file,
  'entries as object map': Object.fromEntries(file.entries.map((e, i) => [i, e])),
  'string': 'baseline.json',
  'entries with ruleId missing': file.entries.map(({ ruleId, ...e }) => e),
  'entries with html missing': file.entries.map(({ html, ...e }) => e),
  'entries with frame:"x"': file.entries.map((e) => ({ ...e, frame: 'x' })),
  'entries with frame:[]': file.entries.map((e) => ({ ...e, frame: [] })),
  'entries with numbers for strings': file.entries.map((e) => ({ ...e, ruleId: 5, html: 7 })),
  'null': null
};
for (const [name, bl] of Object.entries(cases)) {
  const r = h.capture(() => B.matchBaseline(res, bl));
  console.log(`  ${name.padEnd(38)}`, r.error ? 'THROWS ' + r.error.message : `known ${r.value.knownCount} new ${r.value.newCount} stale ${r.value.staleCount}`, r.logs.length ? r.logs : '');
}
process.exit(0);
