// Reason codes the rules emit on the fixtures (jsdom, every rule, AAA) that their @reason-codes header doesn't list:
// checkPack would report a pack's mapping row for such a code as "never matches".
const fs = require('fs'), path = require('path');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const { readRuleProse } = require('/home/user/core-r8/src/rule-docs.js');
const header = new Map();
for (const d of ['automatic', 'manual']) for (const [id, p] of readRuleProse(path.join('/home/user/core-r8/src/checks', d))) header.set(id, new Set((p.reasonCodes || []).map(c => c.code)));
const dir = '/home/user/core-r8/tests/fixtures/';
const emitted = new Map();
(async () => {
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
    const w = console.warn; console.warn = () => {};
    let r; try { r = runa11yCoreOnHtml(fs.readFileSync(dir + f, 'utf8'), { engineOptions: { optInRules: 'all', wcagLevel: 'AAA' } }); } catch { continue; } finally { console.warn = w; }
    for (const c of r.checksResults) for (const o of c.occurrences || []) { const code = o.data && o.data.details && o.data.details.reasonCode; if (code) { if (!emitted.has(c.ruleId)) emitted.set(c.ruleId, new Map()); emitted.get(c.ruleId).set(code, f); } }
    await new Promise(s => setImmediate(s));
  }
  let n = 0;
  for (const [id, codes] of emitted) { const h = header.get(id); for (const [code, f] of codes) if (!h || !h.has(code)) { n++; console.log(id, code, 'not in header', h ? '[' + [...h].join(',') + ']' : '(no header codes)', 'seen in', f); } }
  console.log('done', n);
})();
