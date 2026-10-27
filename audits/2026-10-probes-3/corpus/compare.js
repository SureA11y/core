'use strict';
// Tallies old->new outcome transitions and occurrence changes from run-corpus.js output.
// usage: node compare.js <outDir> [excludeRuleId,...]
const fs = require('node:fs');
const path = require('node:path');
const [outDir, excl] = process.argv.slice(2);
const EXCLUDE = new Set((excl || '').split(',').filter(Boolean));
const load = (run, page) => JSON.parse(fs.readFileSync(path.join(outDir, run, page), 'utf8'));
const pages = fs.readdirSync(path.join(outDir, 'old')).filter((f) => f.endsWith('.json')).sort();

const trans = {}; // rule -> "a->b" -> [pages]
const occ = {}; // rule -> {pages, added, removed}
const noise = {}; // rule -> pages where new1 != new2
const errors = [];
const timing = [];
const ruleTime = {}; // rule -> {old, new}
const onlyIn = { old: new Set(), new: new Set() };
const harness = [];
for (const p of pages) {
  const o = load('old', p);
  const a = load('new1', p);
  const b = load('new2', p);
  if (!o.rules || !a.rules || !b.rules) { harness.push([p, o.thrown || o.harnessError, a.thrown || a.harnessError]); continue; }
  timing.push({ page: p.replace('.json', ''), old: o.ms, new1: a.ms, new2: b.ms });
  for (const [run, r] of [['old', o], ['new1', a], ['new2', b]]) {
    for (const [id, c] of Object.entries(r.rules)) {
      if (c.error && c.outcome === 'cantTell' && c.n === 0) errors.push({ run, page: p, id, error: c.error });
    }
    if (r.timings) for (const [id, t] of Object.entries(r.timings)) {
      ruleTime[id] = ruleTime[id] || { old: 0, new: 0 };
      if (run === 'old') ruleTime[id].old += t; else if (run === 'new1') ruleTime[id].new += t;
    }
  }
  const ids = new Set([...Object.keys(o.rules), ...Object.keys(a.rules)]);
  for (const id of ids) {
    if (EXCLUDE.has(id)) continue;
    if (!o.rules[id]) { onlyIn.new.add(id); continue; }
    if (!a.rules[id]) { onlyIn.old.add(id); continue; }
    const key = (c) => c.outcome + ':' + c.sel.map((s) => s.join('|')).sort().join(',');
    if (key(a.rules[id]) !== key(b.rules[id])) (noise[id] = noise[id] || []).push(p);
    const oc = o.rules[id].outcome;
    const nc = a.rules[id].outcome;
    if (oc !== nc) {
      trans[id] = trans[id] || {};
      (trans[id][`${oc}->${nc}`] = trans[id][`${oc}->${nc}`] || []).push(p.replace('.json', ''));
    }
    const os = new Set(o.rules[id].sel.map((s) => s[0]));
    const ns = new Set(a.rules[id].sel.map((s) => s[0]));
    const added = [...ns].filter((s) => !os.has(s));
    const removed = [...os].filter((s) => !ns.has(s));
    if (o.rules[id].n !== a.rules[id].n || added.length || removed.length) {
      occ[id] = occ[id] || { pages: 0, oldN: 0, newN: 0, added: 0, removed: 0, ex: [] };
      occ[id].pages++;
      occ[id].oldN += o.rules[id].n;
      occ[id].newN += a.rules[id].n;
      occ[id].added += added.length;
      occ[id].removed += removed.length;
      if (occ[id].ex.length < 6) occ[id].ex.push({ page: p, oldN: o.rules[id].n, newN: a.rules[id].n, added: added.slice(0, 3), removed: removed.slice(0, 3) });
    }
  }
}
const totalTrans = Object.values(trans).reduce((s, t) => s + Object.values(t).reduce((x, y) => x + y.length, 0), 0);
console.log(JSON.stringify({
  pages: pages.length, harness, excluded: [...EXCLUDE], onlyIn: { old: [...onlyIn.old], new: [...onlyIn.new] },
  totalOutcomeTransitions: totalTrans, transitions: trans, occurrenceChanges: occ, noiseNew1VsNew2: noise,
  ruleErrors: errors,
  timingSummary: {
    oldTotal: timing.reduce((s, t) => s + t.old, 0), new1Total: timing.reduce((s, t) => s + t.new1, 0), new2Total: timing.reduce((s, t) => s + t.new2, 0),
    slower20: timing.filter((t) => Math.min(t.new1, t.new2) > t.old * 1.2 && Math.min(t.new1, t.new2) - t.old > 30)
      .map((t) => ({ ...t, ratio: +(Math.min(t.new1, t.new2) / t.old).toFixed(2) }))
  },
  ruleTimeTop: Object.entries(ruleTime).map(([id, t]) => ({ id, old: Math.round(t.old), new: Math.round(t.new), d: Math.round(t.new - t.old) }))
    .sort((x, y) => y.d - x.d).slice(0, 15)
}, null, 1));
