'use strict';
// After one scan: which DOM nodes did the scan create and keep alive, and what holds them?
// Takes a heap snapshot and lists Detached* node classes and a retainer path for a sample.
const fs = require('fs');
const { serve, launch, addBundle } = require('./lib');
const file = process.argv[2] || 'combined.html';
const html = fs.readFileSync(__dirname + '/' + file, 'utf8');

async function snapshot(cdp) {
  const chunks = [];
  const h = (e) => chunks.push(e.chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', h);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', h);
  return JSON.parse(chunks.join(''));
}

function analyze(snap) {
  const m = snap.snapshot.meta;
  const nf = m.node_fields, ef = m.edge_fields;
  const NF = nf.length, EF = ef.length;
  const nodeTypes = m.node_types[0], edgeTypes = m.edge_types[0];
  const iDet = nf.indexOf('detachedness'); const iType = nf.indexOf('type'), iName = nf.indexOf('name'), iEdges = nf.indexOf('edge_count'), iId = nf.indexOf('id');
  const eType = ef.indexOf('type'), eName = ef.indexOf('name_or_index'), eTo = ef.indexOf('to_node');
  const nodes = snap.nodes, edges = snap.edges, strings = snap.strings;
  const n = nodes.length / NF;
  const firstEdge = new Uint32Array(n + 1);
  for (let i = 0, e = 0; i < n; i++) { firstEdge[i] = e; e += nodes[i * NF + iEdges] * EF; firstEdge[i + 1] = e; }
  const name = (i) => (iDet >= 0 && nodes[i * NF + iDet] === 2 ? 'Detached ' : '') + strings[nodes[i * NF + iName]];
  const counts = new Map();
  const detached = [];
  for (let i = 0; i < n; i++) {
    const nm = name(i);
    if (nm.startsWith('Detached ')) { counts.set(nm, (counts.get(nm) || 0) + 1); detached.push(i); }
  }
  // reverse edges for retainers
  const retainers = new Map();
  for (let i = 0; i < n; i++) {
    for (let e = firstEdge[i]; e < firstEdge[i + 1]; e += EF) {
      const to = edges[e + eTo] / NF;
      const t = edgeTypes[edges[e + eType]];
      if (t === 'weak') continue;
      const en = t === 'element' || t === 'hidden' ? '[' + edges[e + eName] + ']' : strings[edges[e + eName]];
      if (!retainers.has(to)) retainers.set(to, []);
      const arr = retainers.get(to);
      if (arr.length < 6) arr.push([i, en, t]);
    }
  }
  const pathOf = (start) => {
    // BFS up retainers to a non-DOM JS object chain, max depth 14
    const out = [];
    let cur = start;
    const seen = new Set([cur]);
    for (let d = 0; d < 14; d++) {
      const rs = (retainers.get(cur) || []).filter(([i]) => !seen.has(i));
      const pref = rs.find(([i]) => !name(i).startsWith('Detached')) || rs[0];
      if (!pref) break;
      out.push(`${name(pref[0]).slice(0, 50)}.${String(pref[1]).slice(0, 40)}(${pref[2]})`);
      cur = pref[0];
      seen.add(cur);
      if (/^(Window|system \/ Context)/.test(name(cur)) && d > 3) break;
    }
    return out.join(' <- ');
  };
  const byName = new Map();
  for (let i = 0; i < n; i++) { const nm = name(i); if (/^(Detached )?(HTML|SVG|Text|Comment|DocumentFragment|ShadowRoot|Range|CSSStyleDeclaration|CSSStyleSheet|Attr)/.test(nm)) byName.set(nm, (byName.get(nm) || 0) + 1); }
  const css = [];
  for (let i = 0; i < n && css.length < 3000; i++) if (name(i) === 'CSSStyleDeclaration') css.push(i);
  const cssPaths = css.filter((_, k) => k % 700 === 5).map((i) => pathOf(i));
  return { cssPaths, byName, counts: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 12), sample: detached.filter((_, k) => k % Math.max(1, Math.floor(detached.length / 4)) === 0).slice(0, 4).map((i) => name(i) + ' :: ' + pathOf(i)) };
}

(async () => {
  const s = await serve({ '/c': { body: html } });
  const { browser, context } = await launch();
  const page = await context.newPage();
  await page.goto(s.base + '/c');
  await addBundle(page, s.base);
  const cdp = await context.newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.collectGarbage');
  const a = analyze(await snapshot(cdp));
  console.log('BEFORE detached', JSON.stringify(a.counts));
  await page.evaluate(() => { window.a11ycore.runa11yCoreInPage(null, null, {}, null); return 0; });
  await cdp.send('HeapProfiler.collectGarbage');
  const b = analyze(await snapshot(cdp));
  console.log('AFTER detached', JSON.stringify(b.counts));
  const keys = new Set([...a.byName.keys(), ...b.byName.keys()]);
  const d = [...keys].map((k) => [k, (b.byName.get(k) || 0) - (a.byName.get(k) || 0)]).filter((x) => x[1]).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 20);
  for (const p of b.cssPaths) console.log('  CSSStyleDeclaration <- ' + p);
  console.log('class count deltas', JSON.stringify(d));
  for (const x of b.sample) console.log('  ' + x);
  await browser.close();
  s.close();
})();
