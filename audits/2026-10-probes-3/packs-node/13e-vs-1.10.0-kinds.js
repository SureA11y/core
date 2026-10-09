'use strict';
// Like 13d, aggregated by path kind (rule id replaced by *), one example each.
// rollups replaced by their ids), counting pages per path; meta.helpUrl of
// best-practice rules (changelogged, #164) reported separately.
const path = require('path');
const fs = require('fs');
const { scan, quiet, strip, ROOT } = require('./lib.js');
const old = require(path.join(__dirname, '_old/package/src/index.js'));
const dir = path.join(ROOT, 'tests/fixtures');
const counts = new Map(); const ex = new Map();
function walk(a, b, p, out) {
  if (a === b) return;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') { out.add(`${p}  (${String(JSON.stringify(b)).slice(0, 60)} -> ${String(JSON.stringify(a)).slice(0, 60)})`.replace(/\(.*\)$/, (m) => (/helpUrl|summary|hint|html|selector/.test(p) ? '' : m))); return; }
  const keyed = (arr) => Array.isArray(arr) && arr.every((x) => x && x.ruleId) ? Object.fromEntries(arr.map((x) => [x.ruleId, x])) : arr;
  const A = keyed(a), B = keyed(b);
  for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) walk(A[k], B[k], p + '.' + (/^\d+$/.test(k) ? '#' : k), out);
}
const files = fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort();
for (const f of files) {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
  const n = strip(quiet(() => scan({}, { html })).r || {});
  const o = strip(quiet(() => scan({}, { html, impl: old })).r || {});
  const out = new Set(); walk(n, o, '', out);
  for (const k0 of out) { const k = k0.replace(/^\.(checksResults|rulesResults)\.[^.]+/, '.$1.*').replace(/  \(.*$/, ''); counts.set(k, (counts.get(k) || 0) + 1); if (!ex.has(k)) ex.set(k, f + ' ' + k0); }
}
console.log(`${files.length} pages`);
for (const [k, c] of [...counts].sort((x, y) => y[1] - x[1])) console.log(String(c).padStart(5), k, '   e.g.', ex.get(k).slice(0, 220));
console.log('helpUrl paths:', [...counts.keys()].filter((k) => /meta\.helpUrl/.test(k)).length);
