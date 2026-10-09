'use strict';
// Scans the same DOM twice (in-page entry point) and prints occurrences that differ for <ruleId>, or for all rules when ruleId is "all".
// usage: node rescan.js <seed|file.html> <ruleId|all>
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.resolve(__dirname, '../../..');
const { createDom } = require(path.join(ROOT, 'src/testing.js'));
const { runa11yCoreInPage } = require(path.join(ROOT, 'src/index.js'));
const Module = require('node:module');
console.warn = () => {};
const [arg, ruleId] = process.argv.slice(2);
let doc;
if (/^\d+$/.test(arg)) {
  const src = fs.readFileSync(path.join(__dirname, 'fuzz.js'), 'utf8').split('// Silence the engine')[0];
  const m = new Module(path.join(__dirname, 'fuzz.js'));
  m.paths = Module._nodeModulePaths(__dirname);
  m._compile(src + '\nmodule.exports = { gen };', path.join(__dirname, 'fuzz.js'));
  doc = m.exports.gen(Number(arg));
} else doc = { html: fs.readFileSync(arg, 'utf8'), shadows: [] };
const dom = createDom(doc.html);
const els = Array.from(dom.window.document.body ? dom.window.document.body.querySelectorAll('*') : []);
for (const [idx, inner] of doc.shadows) { if (!els.length) break; try { els[idx % els.length].attachShadow({ mode: 'open' }).innerHTML = inner; } catch {} }
const before = dom.window.document.documentElement.outerHTML;
const r1 = runa11yCoreInPage('https://example.test/', null, { optInRules: 'all' }, null);
const mid = dom.window.document.documentElement.outerHTML;
const r2 = runa11yCoreInPage('https://example.test/', null, { optInRules: 'all' }, null);
console.log('DOM changed by scan 1:', before !== mid);
const key = (o) => (o.shadowHostSelectors || []).join('>') + '|' + o.selector + '|' + o.summary;
for (const c1 of r1.checksResults) {
  if (ruleId !== 'all' && c1.ruleId !== ruleId) continue;
  const c2 = r2.checksResults.find((x) => x.ruleId === c1.ruleId);
  const k1 = c1.occurrences.map(key);
  const k2 = c2.occurrences.map(key);
  if (c1.outcome !== c2.outcome || k1.join('\n') !== k2.join('\n') || (c1.error || '') !== (c2.error || '')) {
    console.log('==', c1.ruleId, c1.outcome, '->', c2.outcome, (c1.error || '').slice(0, 80), '|', (c2.error || '').slice(0, 80));
    for (const k of k1) if (!k2.includes(k)) console.log('  only 1st:', k.slice(0, 300));
    for (const k of k2) if (!k1.includes(k)) console.log('  only 2nd:', k.slice(0, 300));
  }
}
