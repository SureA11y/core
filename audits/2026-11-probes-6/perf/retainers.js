// Shortest retainer paths from GC roots to every object whose constructor is Window.
const fs = require('fs');
const s = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const m = s.snapshot.meta, NF = m.node_fields.length, EF = m.edge_fields.length;
const nTypes = m.node_types[0], eTypes = m.edge_types[0];
const N = s.nodes, E = s.edges, S = s.strings;
const nodeCount = N.length / NF;
const firstEdge = new Uint32Array(nodeCount + 1);
for (let i = 0, e = 0; i < nodeCount; i++) { firstEdge[i] = e; e += N[i * NF + m.node_fields.indexOf('edge_count')] * EF; firstEdge[i + 1] = e; }
const nameOf = (i) => S[N[i * NF + m.node_fields.indexOf('name')]];
const typeOf = (i) => nTypes[N[i * NF + m.node_fields.indexOf('type')]];
const prev = new Int32Array(nodeCount).fill(-1), prevEdge = new Int32Array(nodeCount).fill(-1);
const seen = new Uint8Array(nodeCount); const q = [0]; seen[0] = 1;
const toIdx = m.edge_fields.indexOf('to_node'), etIdx = m.edge_fields.indexOf('type'), enIdx = m.edge_fields.indexOf('name_or_index');
while (q.length) {
  const n = q.shift();
  for (let e = firstEdge[n]; e < firstEdge[n + 1]; e += EF) {
    const et = eTypes[E[e + etIdx]];
    if (et === 'weak' || et === 'shortcut') continue;
    const t = E[e + toIdx] / NF;
    if (seen[t]) continue; seen[t] = 1; prev[t] = n; prevEdge[t] = e; q.push(t);
  }
}
let shown = 0;
for (let i = 0; i < nodeCount && shown < 6; i++) {
  if (nameOf(i) !== 'Window' || typeOf(i) !== 'object' || !seen[i]) continue;
  shown++;
  const path = [];
  for (let c = i; c > 0 && path.length < 25; c = prev[c]) {
    const e = prevEdge[c]; const et = eTypes[E[e + etIdx]];
    const en = et === 'element' || et === 'hidden' ? E[e + enIdx] : S[E[e + enIdx]];
    path.push(`${nameOf(prev[c])} --[${et}:${en}]--> ${nameOf(c)}`);
  }
  console.log('--- Window', i); console.log(path.reverse().join('\n'));
}
