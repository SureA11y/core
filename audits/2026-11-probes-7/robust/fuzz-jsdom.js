'use strict';
// node fuzz-jsdom.js <mode: gen|mut|fix> <from> <to> [singles]
const fs = require('fs');
const path = require('path');
const L = require('./lib.js');
const G = require('./gen.js');
const mode = process.argv[2];
const from = +process.argv[3], to = +process.argv[4];
const singles = +(process.argv[5] || 4);
const FIX = '/home/user/core/tests/fixtures';
const fixtures = fs.readdirSync(FIX).filter((f) => f.endsWith('.html')).sort();
const outFile = `/tmp/surea11y-audit/r7/robust/out/fuzz-${mode}-${from}-${to}.jsonl`;
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, '');
const origWarn = console.warn; console.warn = () => {};
const log = (o) => fs.appendFileSync(outFile, JSON.stringify(o) + '\n');
let scans = 0;

function pageFor(i) {
  if (mode === 'gen') return { name: 'gen' + i, html: G.make(i, { budget: 40 + (i % 7) * 40, maxDepth: 4 + (i % 9) }) };
  if (mode === 'fix') { const f = fixtures[i % fixtures.length]; return { name: f, html: fs.readFileSync(path.join(FIX, f), 'utf8') }; }
  const f = fixtures[i % fixtures.length];
  return { name: f + '#mut' + i, html: G.mutate(fs.readFileSync(path.join(FIX, f), 'utf8'), i * 7919 + 1) };
}

const R = G.rng(from + 12345);
(async () => {
for (let i = from; i < to; i++) {
  const { name, html } = pageFor(i);
  const problems = [];
  const t0 = Date.now();
  let r1;
  try {
    const dom = L.open(html);
    const s0 = L.snapshot(dom.window.document);
    r1 = L.scanJsdom(html, {}, null, dom).r; scans++;
    const s1 = L.snapshot(dom.window.document);
    if (s0 !== s1) {
      const a = s0.split('\n'), b = s1.split('\n');
      let k = 0; while (k < a.length && a[k] === b[k]) k++;
      problems.push(`DOM mutated at line ${k}: ${String(a[k]).slice(0, 150)} => ${String(b[k]).slice(0, 150)}`);
    }
    problems.push(...L.checkInvariants(r1, 'en'));
    // same DOM rescan
    const r2 = L.scanJsdom(html, {}, null, dom).r; scans++;
    const p1 = JSON.stringify(L.project(r1)), p2 = JSON.stringify(L.project(r2));
    if (p1 !== p2) problems.push('rescan-same-dom differs: ' + diff(L.project(r1), L.project(r2)));
    try { dom.window.close(); } catch {}
    // fresh parse
    const r3 = L.scanJsdom(html).r; scans++;
    const p3 = JSON.stringify(L.project(r3));
    if (p1 !== p3) problems.push('rescan-fresh differs: ' + diff(L.project(r1), L.project(r3)));
    // locales
    for (const loc of ['de', 'es', 'fr', 'ja']) {
      const rl = L.scanJsdom(html, { locale: loc }).r; scans++;
      for (const p of L.checkInvariants(rl, loc)) if (!/error:/.test(p)) problems.push(p);
      const a = JSON.stringify(L.project(r1, { withText: false })), b = JSON.stringify(L.project(rl, { withText: false }));
      if (a !== b) problems.push(`locale ${loc} changes outcome: ` + diff(L.project(r1, { withText: false }), L.project(rl, { withText: false })));
    }
    // singles
    const ids = r1.checksResults.map((c) => c.ruleId);
    const interesting = r1.checksResults.filter((c) => c.outcome !== 'notApplicable').map((c) => c.ruleId);
    const chosen = new Set();
    for (let k = 0; k < singles; k++) chosen.add((k % 2 ? ids : (interesting.length ? interesting : ids))[Math.floor(R() * (k % 2 ? ids.length : (interesting.length || ids.length)))]);
    for (const id of chosen) {
      const rs = L.scanJsdom(html, {}, { includeRuleIds: [id] }).r; scans++;
      const one = rs.checksResults.find((c) => c.ruleId === id);
      const full = r1.checksResults.find((c) => c.ruleId === id);
      if (!one) { problems.push(`single ${id}: missing`); continue; }
      const a = JSON.stringify(L.project({ checksResults: [full] })), b = JSON.stringify(L.project({ checksResults: [one] }));
      if (a !== b) problems.push(`single ${id} differs: ` + diff(L.project({ checksResults: [full] }), L.project({ checksResults: [one] })));
    }
  } catch (e) {
    problems.push('THROW ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : String(e)));
  }
  log({ i, name, ms: Date.now() - t0, len: html.length, problems });
  if (i % 10 === 0) await new Promise((r) => setImmediate(r));
  await new Promise((r) => setImmediate(r));
}
log({ done: true, scans });
})();

function diff(A, B) {
  const out = [];
  const mb = new Map(B.map((c) => [c.ruleId, c]));
  for (const a of A) {
    const b = mb.get(a.ruleId);
    if (!b) { out.push(a.ruleId + ' missing'); continue; }
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push(`${a.ruleId}: ${a.outcome}/${a.occ.length}${a.error ? '/E' : ''} vs ${b.outcome}/${b.occ.length}${b.error ? '/E' : ''} ` + firstOccDiff(a.occ, b.occ));
    }
  }
  return out.slice(0, 5).join('; ');
}
function firstOccDiff(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return `[${i}] ${String(JSON.stringify(a[i])).slice(0, 200)} | ${String(JSON.stringify(b[i])).slice(0, 200)}`;
  return '';
}
