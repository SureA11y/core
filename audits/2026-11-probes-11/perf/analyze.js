'use strict';
// node analyze.js chrome <corpus.json>   |  node analyze.js jsdom   (reads jsdom-<b>-<rep>.json)
const fs = require('fs');
const med = (a) => { a = a.filter((x) => x != null).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
const B = ['r11', 'r8', 'v117'];
let data = {}; // page -> build -> [runs]
if (process.argv[2] === 'chrome') data = JSON.parse(fs.readFileSync(process.argv[3]));
else for (const b of B) for (const rep of [0, 1, 2]) { const f = `${__dirname}/jsdom-${b}-${rep}.json`; if (!fs.existsSync(f)) continue; const d = JSON.parse(fs.readFileSync(f)); for (const [p, r] of Object.entries(d)) ((data[p] = data[p] || {})[b] = data[p][b] || []).push(r); }
const pages = Object.keys(data);
const tot = {}; const rule = {}; // rule -> build -> sum of medians ; perPage flags
const flags = [];
const rows = [];
for (const p of pages) {
  const row = { p };
  for (const b of B) { const runs = (data[p][b] || []).filter((x) => !x.err); row[b] = med(runs.map((x) => x.total)); row[b + 'w'] = med(runs.map((x) => x.warm)); tot[b] = (tot[b] || 0) + row[b];
    const ids = new Set(runs.flatMap((x) => Object.keys(x.rt || {})));
    for (const id of ids) { const m = med(runs.map((x) => (x.rt || {})[id])); ((rule[id] = rule[id] || {})[b] = (rule[id][b] || 0) + m); (row.rt = row.rt || {})[b + ':' + id] = m; } }
  rows.push(row);
  for (const id of Object.keys(rule)) { const n = row.rt && row.rt['r11:' + id]; if (n == null) continue; for (const o of ['r8', 'v117']) { const v = row.rt['' + o + ':' + id]; if (v == null) continue; if (n - v > 20 && n > v * 1.25) flags.push(`${p} ${id} r11=${n.toFixed(0)} ${o}=${v.toFixed(0)}`); } }
}
console.log('TOTAL (sum of per-page medians, ms):', B.map((b) => `${b}=${Math.round(tot[b])}`).join(' '));
const sub = (pre) => B.map((b) => `${b}=${Math.round(rows.filter((r) => r.p.startsWith(pre)).reduce((a, r) => a + r[b], 0))}`).join(' ');
console.log('fixtures:', sub('fx:'), '| realistic:', sub('gen:'));
console.log('warm-up sum:', B.map((b) => `${b}=${Math.round(rows.reduce((a, r) => a + r[b + 'w'], 0))}`).join(' '));
console.log('\nREALISTIC per page (median ms):');
for (const r of rows.filter((r) => r.p.startsWith('gen:'))) console.log(`  ${r.p.padEnd(16)} ${B.map((b) => `${b}=${Math.round(r[b])}`).join(' ')}  r11/r8=${(r.r11 / r.r8).toFixed(2)} r11/v117=${(r.r11 / r.v117).toFixed(2)}`);
console.log('\nRULES summed over corpus, grown >25% and >20ms vs r8 or v117:');
for (const [id, v] of Object.entries(rule).sort((a, c) => (c[1].r11 || 0) - (a[1].r11 || 0))) { const n = v.r11 || 0; const bad = ['r8', 'v117'].some((o) => v[o] != null ? (n - v[o] > 20 && n > v[o] * 1.25) : n > 20); if (bad || process.env.ALL) console.log(`  ${id.padEnd(40)} ${B.map((b) => `${b}=${v[b] == null ? '-' : Math.round(v[b])}`).join(' ')}`); }
console.log('\nTop 25 rules by r11 corpus time:');
for (const [id, v] of Object.entries(rule).sort((a, c) => (c[1].r11 || 0) - (a[1].r11 || 0)).slice(0, 25)) console.log(`  ${id.padEnd(40)} ${B.map((b) => `${b}=${v[b] == null ? '-' : Math.round(v[b])}`).join(' ')}`);
const sumAll = Object.fromEntries(B.map((b) => [b, Object.values(rule).reduce((a, v) => a + (v[b] || 0), 0)]));
console.log('\nsum of rule times:', B.map((b) => `${b}=${Math.round(sumAll[b])}`).join(' '), '| overhead (total - rules - warm):', B.map((b) => `${b}=${Math.round(tot[b] - sumAll[b] - rows.reduce((a, r) => a + r[b + 'w'], 0))}`).join(' '));
console.log('\nPER-PAGE flags (rule grew >25% and >20ms on one page):'); for (const f of flags) console.log('  ' + f);
