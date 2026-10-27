// node time-case5.js <seed>: time each step of runCase5 on one generated case.
const { gen } = require('./gen5.js'); const { runOne } = require('./check5.js'); const { runCase } = require('./check4.js'); console.warn = () => {};
const c = gen(+process.argv[2]); c.engineOptions = { locale: 'ja' };
let t = Date.now(); runCase(c, { determinism: true, profile: true }); console.log('runCase', Date.now() - t);
t = Date.now(); const f = runOne(c, null); console.log('full+serialise', Date.now() - t, f.mutated ? 'MUTATED' : '');
for (const id of (process.argv[3] || 'duplicate-id').split(',')) { t = Date.now(); runOne(c, { includeRuleIds: [id] }); console.log('alone', id, Date.now() - t); }
