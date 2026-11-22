const fs = require('fs'); const ROOT = '/home/user/r12-api';
const { JSDOM } = require(ROOT + '/node_modules/jsdom'); const { runDomRulesInPage } = require(ROOT + '/src/index.js');
const { readRuleProse } = require(ROOT + '/src/rule-docs.js');
const m = new Map(); for (const d of ['automatic', 'manual']) for (const [id, p] of readRuleProse(ROOT + '/src/checks/' + d)) m.set(id, (p.reasonCodes || []).map(x => x.code));
const FIX = ROOT + '/tests/fixtures'; const files = fs.readdirSync(FIX).filter(f => f.endsWith('.html'));
const seen = new Map(); console.warn = () => {};
for (const f of files) {
  try { const d = new JSDOM(fs.readFileSync(FIX + '/' + f, 'utf8'), { url: 'https://example.test/', pretendToBeVisual: true }); global.window = d.window; global.document = d.window.document;
    const r = runDomRulesInPage('https://example.test/', null, { includeHiddenElements: false }, null);
    for (const c of r.checksResults) for (const o of c.occurrences || []) { const code = o.data && o.data.details && o.data.details.reasonCode; if (code) { const k = c.ruleId + '|' + code; if (!seen.has(k)) seen.set(k, f); } }
    d.window.close(); } catch (e) { }
}
let n = 0; for (const [k, f] of seen) { const [rule, code] = k.split('|'); const have = m.get(rule); if (have && !have.includes(code)) { n++; console.log('NOT IN HEADER', rule, code, f); } }
console.log('pairs', seen.size, 'files', files.length, 'missing', n);
