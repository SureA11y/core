// Which rules report fail/cantTell occurrences with no data.details.reasonCode (PACKS.md: "reasonCode on every rule")?
'use strict';
const fs = require('fs');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const ids = require('/home/user/core/scripts/data/finding-ids.json');
const dir = '/home/user/core/tests/fixtures/';
const missing = new Map(), withCode = new Set();
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('-all-scenarios.html'))) {
  let r;
  try { r = runa11yCoreOnHtml(fs.readFileSync(dir + f, 'utf8'), {}); } catch (e) { continue; }
  for (const c of r.checksResults) {
    if (c.outcome !== 'fail' && c.outcome !== 'cantTell') continue;
    for (const o of c.occurrences || []) {
      const code = o.data && o.data.details && o.data.details.reasonCode;
      if (code) withCode.add(c.ruleId); else missing.set(c.ruleId, (missing.get(c.ruleId) || 0) + 1);
    }
  }
}
const codes = ids.reasonCodes || {};
console.log('rules with some occurrence lacking reasonCode:', missing.size);
for (const [k, n] of [...missing].sort()) console.log(' ', k.padEnd(40), n, withCode.has(k) ? '(others have codes)' : '(never a code)', 'inventory:', JSON.stringify(codes[k] || null).slice(0, 80));
