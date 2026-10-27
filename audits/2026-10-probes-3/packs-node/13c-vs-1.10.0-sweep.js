'use strict';
// Every tests/fixtures/*.html page, no packs: HEAD vs published 1.10.0, deep
// compare (timings stripped, engine.version ignored). Lists pages that
// differ and the first differing path in each.
const path = require('path');
const fs = require('fs');
const { scan, quiet, strip, ROOT } = require('./lib.js');
const old = require(path.join(__dirname, '_old/package/src/index.js'));
const dir = path.join(ROOT, 'tests/fixtures');
function firstDiff(a, b, p = '') {
  if (a === b) return null;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return `${p}: ${String(JSON.stringify(b)).slice(0, 120)} -> ${String(JSON.stringify(a)).slice(0, 120)}`;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const d = firstDiff(a[k], b[k], p + '.' + k);
    if (d) return d;
  }
  return null;
}
let same = 0; const diffs = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
  const n = strip(quiet(() => scan({}, { html })).r || {});
  const o = strip(quiet(() => scan({}, { html, impl: old })).r || {});
  const d = firstDiff(n, o);
  if (d) {
    // name the rule where it differs
    const m = /^\.checksResults\.(\d+)/.exec(d);
    diffs.push(`${f}  ${m ? '[' + (n.checksResults[m[1]] || {}).ruleId + '] ' : ''}${d}`);
  } else same++;
}
console.log(`identical: ${same}, differ: ${diffs.length}`);
for (const d of diffs) console.log(d);
