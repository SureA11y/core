const L = require('./lib'); const { core } = L;
const RO = { includeRuleIds: ['duplicate-id', 'target-size-minimum'] };
for (const v of ['2.1', null, 2.1, '2.1 ', 'v2.1', '3.0']) for (const strict of [false, true]) {
  const eo = { wcagVersion: v, ...(strict ? { strictOptions: true } : {}) };
  const s = L.scan(RO, eo); const g = L.capture(() => core.getRulesForRunOnly(RO, eo));
  console.log(JSON.stringify(v), strict, '| scan', s.error ? 'THROW ' + s.error.message.slice(0, 100) : s.value.rulesResults.map((r) => r.ruleId).join(',') + ' v=' + s.value.engine.wcagVersion, s.warned.map((w) => w.slice(0, 100)), '| list', g.error ? 'THROW' : g.value.map((r) => r.id).join(','));
}
// unknown option under strict
const g = L.capture(() => core.getRulesForRunOnly(null, { strictOptions: true, bogus: 1 }));
console.log('bogus strict list:', g.error ? 'THROW ' + g.error.message : 'no throw ' + g.value.length);
