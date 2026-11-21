'use strict';
// Heap snapshot diff around a jsdom scan (after clearing jsdom's style cache): what object kinds stay?
// node --expose-gc jsdom-heapdiff.js <rows>
const v8 = require('v8');
const fs = require('fs');
const { JSDOM } = require('/home/user/core-r9/node_modules/jsdom');
const { runDomRulesInPage } = require('/home/user/core-r9/src/index.js');
const rows = Number(process.argv[2] || 300);
const html = `<!doctype html><html lang=en><head><title>t</title></head><body><main><h1>T</h1><table><caption>D</caption><tbody>${Array.from({ length: rows }, (_, r) => `<tr><th scope=row>R${r}</th>${Array.from({ length: 7 }, (_, c) => `<td>${r * c}</td>`).join('')}</tr>`).join('')}</tbody></table></main></body></html>`;
const settle = async () => { await new Promise((r) => setTimeout(r, 20)); global.gc(); };
function retainerPaths(snap, pick, count) {
  const m = snap.snapshot.meta; const nf = m.node_fields, ef = m.edge_fields; const NF = nf.length, EF = ef.length;
  const iName = nf.indexOf('name'), iEdges = nf.indexOf('edge_count'), iType = nf.indexOf('type');
  const eType = ef.indexOf('type'), eName = ef.indexOf('name_or_index'), eTo = ef.indexOf('to_node');
  const types = m.node_types[0], etypes = m.edge_types[0];
  const nodes = snap.nodes, edges = snap.edges, S = snap.strings; const n = nodes.length / NF;
  const name = (i) => types[nodes[i * NF + iType]] + ':' + S[nodes[i * NF + iName]].slice(0, 50);
  const ret = new Map();
  for (let i = 0, e = 0; i < n; i++) { const ec = nodes[i * NF + iEdges]; for (let k = 0; k < ec; k++, e += EF) { const t = etypes[edges[e + eType]]; if (t === 'weak') continue; const to = edges[e + eTo] / NF; const en = (t === 'element' || t === 'hidden') ? '[' + edges[e + eName] + ']' : S[edges[e + eName]]; let a = ret.get(to); if (!a) ret.set(to, a = []); if (a.length < 8) a.push([i, String(en).slice(0, 40), t]); } }
  const picks = []; for (let i = 0; i < n && picks.length < 2000; i++) if (pick(name(i))) picks.push(i);
  const out = [];
  for (const start of picks.filter((_, k) => k % Math.max(1, Math.floor(picks.length / count)) === 0).slice(0, count)) {
    const path = []; let cur = start; const seen = new Set([cur]);
    for (let d = 0; d < 18; d++) { const rs = (ret.get(cur) || []).filter(([i]) => !seen.has(i)); const pref = rs.find(([i, en, t]) => t === 'context' || t === 'property' && !/^(__proto__|map)$/.test(en)) || rs[0]; if (!pref) break; path.push(name(pref[0]) + ' .' + pref[1] + '(' + pref[2] + ')'); cur = pref[0]; seen.add(cur); }
    out.push(name(start) + '\n      <- ' + path.join('\n      <- '));
  }
  return out;
}
let LAST = null;
function census(file) {
  const snap = JSON.parse(fs.readFileSync(file, 'utf8'));
  LAST = snap;
  fs.unlinkSync(file);
  const m = snap.snapshot.meta; const nf = m.node_fields; const NF = nf.length;
  const iName = nf.indexOf('name'), iSize = nf.indexOf('self_size'), iType = nf.indexOf('type');
  const types = m.node_types[0];
  const out = new Map();
  for (let i = 0; i < snap.nodes.length; i += NF) {
    const k = types[snap.nodes[i + iType]] + ':' + snap.strings[snap.nodes[i + iName]].slice(0, 60);
    const e = out.get(k) || [0, 0];
    e[0]++; e[1] += snap.nodes[i + iSize];
    out.set(k, e);
  }
  return out;
}
(async () => {
  const dom = new JSDOM(html, { url: 'https://example.test/', pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  await settle();
  const a = census(v8.writeHeapSnapshot('/tmp/surea11y-audit/r9/robust/prof/a.heapsnapshot'));
  runDomRulesInPage('https://example.test/', null, {}, null);
  dom.window.document.body.appendChild(dom.window.document.createElement('i'));
  await settle();
  const b = census(v8.writeHeapSnapshot('/tmp/surea11y-audit/r9/robust/prof/b.heapsnapshot'));
  const rowsOut = [];
  for (const [k, [c, s]] of b) { const [c0, s0] = a.get(k) || [0, 0]; if (s - s0 > 50000) rowsOut.push([k, c - c0, s - s0]); }
  rowsOut.sort((x, y) => y[2] - x[2]);
  let tot = 0; for (const r of rowsOut) tot += r[2];
  console.log('rows', rows, 'retained growth (classes > 50 KB):', Math.round(tot / 1e6), 'MB');
  for (const p of retainerPaths(LAST, (nm) => nm === 'hidden:system / JSProxy', 2)) console.log('JSProxy path:', p);
  for (const p of retainerPaths(LAST, (nm) => nm === 'concatenated string:(concatenated string)', 2)) console.log('string path:', p);
  for (const r of rowsOut.slice(0, 8)) console.log(String(Math.round(r[2] / 1e3)).padStart(8), 'KB', String(r[1]).padStart(8), 'objs', r[0]);
})();
