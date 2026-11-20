const { sd, base, mkPack } = require('./lib.js');
const b = base(); const reqs = {}; const tests = {};
for (let i = 0; i < 3000; i++) { const id = `${1 + (i / 100 | 0)}.${i % 100}`; reqs[id] = { title: `R ${id}`, wcagSc: ['1.1.1'], tests: [] };
  for (let j = 0; j < 3; j++) { const tid = `${id}.${j}`; tests[tid] = { title: `T ${tid}`, requirements: [id] }; reqs[id].tests.push(tid); } }
b.data[1].requirements = reqs; b.data[1].tests = tests; b.data[1].ruleMap = { 'img-alt-present': { requirements: ['1.0.0'] } };
const st = sd.standardFromData(b);
let s = Date.now(); st.validate(require('/home/user/core/src/index.js').CHECK_DEFS); console.log('validate()', Date.now() - s, 'ms');
s = Date.now(); mkPack(st); console.log('definePack', Date.now() - s, 'ms');
