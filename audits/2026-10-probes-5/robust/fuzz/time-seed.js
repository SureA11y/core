// node time-seed.js <seed>: one profiled full scan of a generated case, top rules.
const { gen } = require('./gen5.js'); const { scan } = require('./check4.js'); console.warn = () => {};
const c = gen(+process.argv[2]); c.engineOptions = {};
const t = Date.now(); const a = scan(c, { profile: true });
console.log('ms', Date.now() - t, a.error ? 'ERR ' + a.error : '', Object.entries(a.result.perfStats.ruleTimings).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => k + '=' + Math.round(v)).join(' '), 'warmup', Math.round(a.result.perfStats.warmUpMs || 0));
