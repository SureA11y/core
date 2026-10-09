'use strict';
// Every (ruleId, reasonCode) the fixtures produce, under several options,
// against the inventory (scripts/data/finding-ids.json) and the 1.10.0
// release freeze: an emitted code the inventory lacks is an identity no test
// protects; a "DEFAULT" code (no reasonCode) is noted.
const fs = require('fs');
const path = require('path');
const h = require('./h.js');
const { main } = h.load();
const inv = require(h.ROOT + '/scripts/data/finding-ids.json');
const rel = require(h.ROOT + '/scripts/data/released-finding-ids.json');
const has = (obj, rule, code) => { const v = obj.reasonCodes && obj.reasonCodes[rule]; return Array.isArray(v) ? v.includes(code) : !!(v && v[code]); };
const seen = new Map();
const files = fs.readdirSync(path.join(h.ROOT, 'tests/fixtures')).filter((f) => f.endsWith('.html'));
for (const f of files) for (const eo of [{ wcagVersion: '2.1' }, { contrast: { mode: 'auditorAssist' }, includeHiddenElements: true }]) {
  h.setDom(h.fixture(f));
  const r = main.runDomRulesInPage('https://e.test/', null, eo, null);
  for (const c of r.checksResults) for (const o of c.occurrences) {
    const code = (o.data && o.data.details && o.data.details.reasonCode) || 'DEFAULT';
    const k = c.ruleId + ' ' + code + ' [' + c.outcome + ']';
    if (!seen.has(k)) seen.set(k, f);
  }
}
const notInv = [], notRel = [];
for (const [k, f] of seen) {
  const [rule, code, outcome] = k.split(' ');
  if (code === 'DEFAULT') continue;
  if (!has(inv, rule, code)) notInv.push(`${rule} ${code} ${outcome} (${f})`);
  if (!has(rel, rule, code)) notRel.push(`${rule} ${code} ${outcome}`);
}
const defaults = [...seen.keys()].filter((k) => k.includes(' DEFAULT '));
console.log('emitted pairs', seen.size);
console.log('reasonCode shape in inventory:', typeof inv.reasonCodes, Array.isArray(Object.values(inv.reasonCodes)[0]) ? 'arrays' : typeof Object.values(inv.reasonCodes)[0]);
console.log('NOT in finding-ids.json:', notInv.length ? '\n  ' + notInv.join('\n  ') : 'none');
console.log('not in released 1.10.0 (new since):', notRel.length);
console.log('occurrences with no reasonCode (identity uses "DEFAULT"):\n  ' + defaults.join('\n  '));
process.exit(0);
