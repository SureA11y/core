const L = require('./lib'); const { core } = L;
const RO = { includeRuleIds: ['contrast-computable'] };
for (const lv of ['AA', 'aa', ' aA ', 'AA+', '', null, undefined, 2, ['AA'], 'ＡＡ', 'A\u0000', { toString() { return 'AA'; } }, 'aaa', 'AAAA', 'ᴀᴀ', 'A A']) {
  for (const strict of [false, true]) {
    const eo = { wcagVersion: '2.2', wcagLevel: lv, ...(strict ? { strictOptions: true } : {}) };
    const s = L.scan(RO, eo);
    const g = L.capture(() => core.getRulesForRunOnly(RO, eo));
    const c = L.capture(() => core.getChecksForRunOnly(RO, eo));
    const out = (x) => x.error ? 'THROW ' + x.error.code + ' ' + x.error.message.slice(0, 120) : '';
    console.log(JSON.stringify(lv) ?? 'undefined', strict ? 'strict' : '', '| scan:', s.error ? out(s) : s.value.rulesResults.map((r) => r.ruleId.slice(5, 10)).join(',') + ' lvl=' + s.value.engine.wcagLevel, s.warned.map((w) => w.slice(0, 140)),
      '| list:', g.error ? out(g) : g.value.map((r) => r.id.slice(5, 10)).join(','), g.warned.length, '| checks:', c.error ? out(c) : 'ok', c.warned.length);
  }
}
