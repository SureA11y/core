const { sd, deriveStandard, base, mkPack, index } = require('./lib.js');
const t = (label, fn) => { const s = process.hrtime.bigint(); const r = fn(); console.log(label, Number(process.hrtime.bigint() - s) / 1e6 | 0, 'ms'); return r; };
// Deep chain
let cur = base();
const N = 30;
t(`chain of ${N} derivations`, () => {
  for (let i = 1; i <= N; i++) {
    const prev = cur;
    cur = deriveStandard([prev], {
      format: 'surea11y-standard/1', key: `d${i}`, standard: `D${i}`,
      versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: prev.key, version: '1' }] }],
      data: { 1: { requirements: { A: { basedOn: [{ standard: prev.key, id: 'A' }] }, B: { basedOn: [{ standard: prev.key, id: 'B' }] } }, ruleMap: {} } },
      profiles: { [`d${i}-1`]: { version: '1', tags: [`d${i}`], mappedRules: true } }
    });
  }
});
console.log('last link basedOn of A:', JSON.stringify(cur.data[1].requirements.A.basedOn), '(only the immediate base; the root "base" is not reachable from the data)');
// Large standard
function big(nReq, testsPer) {
  const b = base(); const reqs = {}; const tests = {};
  for (let i = 0; i < nReq; i++) {
    const id = `${1 + (i / 100 | 0)}.${i % 100}`;
    reqs[id] = { title: `Requirement ${id}`, wcagSc: ['1.1.1'], tests: [] };
    for (let j = 0; j < testsPer; j++) { const tid = `${id}.${j}`; tests[tid] = { title: `Test ${tid}`, requirements: [id], procedure: { steps: ['Look.'], passWhen: 'ok', failWhen: 'no' } }; reqs[id].tests.push(tid); }
  }
  b.data[1].requirements = reqs; b.data[1].tests = tests;
  const ids = Object.keys(tests);
  b.data[1].ruleMap = { 'img-alt-present': { requirements: ids.slice(0, Math.min(ids.length, 2000)) }, 'form-control-programmatic-label-present': { requirements: ids.slice(-50) } };
  return b;
}
for (const [n, k] of [[200, 3], [1000, 3], [3000, 3]]) {
  const b = big(n, k);
  t(`  [${n} reqs x ${k} tests] checkStandardData`, () => sd.checkStandardData(b));
  const st = t(`  [${n} reqs x ${k} tests] standardFromData`, () => sd.standardFromData(b));
  const p = t(`  [${n} reqs x ${k} tests] definePack`, () => mkPack(st));
  t(`  [${n} reqs x ${k} tests] composites()`, () => p.standard.composites());
  t(`  [${n} reqs x ${k} tests] listProcedures`, () => index.listProcedures({ packs: [p], standard: 'base' }));
  t(`  [${n} reqs x ${k} tests] deriveStandard (all)`, () => deriveStandard([b], {
    format: 'surea11y-standard/1', key: 'der', standard: 'Der',
    versions: [{ version: '1', wcagVersion: '2.2', basedOn: [{ standard: 'base', version: '1' }] }],
    data: { 1: { requirements: Object.fromEntries(Object.keys(b.data[1].requirements).map((id) => [id, { basedOn: [{ standard: 'base', id }] }])), ruleMap: {} } }
  }));
}
