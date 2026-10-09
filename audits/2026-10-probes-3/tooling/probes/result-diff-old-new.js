// Scans one page with the published 1.10.0 and with the packed main build (default options) and lists the paths where the JSON differs.
const path = require('path');
const [oldRoot, newRoot, jsdomFrom] = process.argv.slice(2).map((p) => path.resolve(p));
const { JSDOM } = require(require.resolve('jsdom', { paths: [jsdomFrom] }));
const html = '<!doctype html><html lang="en"><head><title>Probe</title></head><body><main><h1>T</h1><h3>skip</h3><img src="a.png"><a href="/x">Read more</a><a href="/y"></a><form><input type="text"><button></button></form><p style="color:#777;background:#fff">grey</p><div role="button">x</div><table><tr><td>1</td></tr></table></main></body></html>';
function scan(root) {
  const dom = new JSDOM(html, { url: 'https://x.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  const core = require(path.join(root, 'src/index.js'));
  const r = core.runDomRulesInPage('https://x.test/', null, {}, null);
  delete r.timestamp; delete r.perfStats; delete r.engine;
  return JSON.parse(JSON.stringify(r));
}
const a = scan(oldRoot), b = scan(newRoot);
const diffs = new Map();
function walk(x, y, p) {
  const norm = p.replace(/\[\d+\]/g, '[]');
  if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y) || (x === null) !== (y === null)) { diffs.set(norm + ' (type)', (diffs.get(norm + ' (type)') || 0) + 1); return; }
  if (x && typeof x === 'object') {
    if (Array.isArray(x)) { if (x.length !== y.length) diffs.set(norm + ' (length)', (diffs.get(norm + ' (length)') || 0) + 1); for (let i = 0; i < Math.min(x.length, y.length); i++) walk(x[i], y[i], `${p}[${i}]`); return; }
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      if (!(k in y)) diffs.set(`${norm}.${k} (removed)`, (diffs.get(`${norm}.${k} (removed)`) || 0) + 1);
      else if (!(k in x)) diffs.set(`${norm}.${k} (added)`, (diffs.get(`${norm}.${k} (added)`) || 0) + 1);
      else walk(x[k], y[k], `${p}.${k}`);
    }
    return;
  }
  if (x !== y) diffs.set(norm + ' (value)', (diffs.get(norm + ' (value)') || 0) + 1);
}
// align checksResults by ruleId
const byId = (arr) => new Map(arr.map((c) => [c.ruleId, c]));
const ao = byId(a.checksResults), bo = byId(b.checksResults);
console.log('rules only old:', [...ao.keys()].filter((k) => !bo.has(k)).join(',') || 'none', '| only new:', [...bo.keys()].filter((k) => !ao.has(k)).join(',') || 'none');
for (const [id, c] of ao) if (bo.has(id)) walk(c, bo.get(id), 'checksResults[]');
const ar = byId(a.rulesResults), br = byId(b.rulesResults);
for (const [id, c] of ar) if (br.has(id)) walk(c, br.get(id), 'rulesResults[]');
const sa = { ...a, checksResults: 0, rulesResults: 0 }, sb = { ...b, checksResults: 0, rulesResults: 0 };
walk(sa, sb, '');
const outcomes = [...ao].filter(([id, c]) => bo.has(id) && bo.get(id).outcome !== c.outcome).map(([id, c]) => `${id}:${c.outcome}->${bo.get(id).outcome}`);
console.log('outcome changes:', outcomes.join(', ') || 'none');
for (const [k, n] of [...diffs].sort()) console.log(n, k);
