'use strict';
// For a fuzz seed (or an HTML file), runs one rule through each entry point on
// fresh DOMs, in both orders, and prints the occurrence selectors of each.
// usage: node parity.js <seed|file.html> <ruleId>
const path = require('node:path');
const fs = require('node:fs');
const ROOT = path.resolve(__dirname, '../../..');
const { createDom } = require(path.join(ROOT, 'src/testing.js'));
const { runa11yCoreInPage, runDomRulesInPage } = require(path.join(ROOT, 'src/index.js'));
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
function fresh() {
  const dom = createDom(doc.html);
  const els = Array.from(dom.window.document.body ? dom.window.document.body.querySelectorAll('*') : []);
  for (const [idx, inner] of doc.shadows) { if (!els.length) break; try { els[idx % els.length].attachShadow({ mode: 'open' }).innerHTML = inner; } catch {} }
  return dom;
}
const sum = (r) => { const c = r.checksResults.find((x) => x.ruleId === ruleId); return c.outcome + ' n=' + c.occurrences.length + ' ' + (c.error || '').slice(0, 60) + ' ' + JSON.stringify(c.occurrences.map((o) => o.selector + (o.details && o.details.reasonCode ? '/' + o.details.reasonCode : (o.data && o.data.details && o.data.details.reasonCode ? '/' + o.data.details.reasonCode : '')))).slice(0, 600); };
const opts = { optInRules: 'all' };
for (const [label, fns] of [['inPage fresh', [runa11yCoreInPage]], ['node fresh', [runDomRulesInPage]], ['inPage then node', [runa11yCoreInPage, runDomRulesInPage]], ['node then inPage', [runDomRulesInPage, runa11yCoreInPage]], ['inPage then inPage', [runa11yCoreInPage, runa11yCoreInPage]]]) {
  fresh();
  const outs = fns.map((f) => sum(f('https://example.test/', null, opts, null)));
  console.log(label, '\n  ' + outs.join('\n  '));
}
