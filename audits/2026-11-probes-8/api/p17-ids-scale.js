const core = require('/home/user/core-r8/src/index.js');
console.warn = () => {};
for (const n of [5000, 10000, 20000, 40000]) {
  const ids = Array.from({ length: n }, (_, i) => i ? 'nope' + i : 'img-alt-present');
  let t = Date.now(); core.getChecksForRunOnly({ includeRuleIds: ids }); const a = Date.now() - t;
  const ex = Array.from({ length: n }, (_, i) => 'nope' + i);
  t = Date.now(); core.getChecksForRunOnly({ excludeRuleIds: ex }); const b = Date.now() - t;
  const tags = Array.from({ length: n }, (_, i) => i ? 'nopetag' + i : 'wcag2a');
  t = Date.now(); core.getChecksForRunOnly({ tags }); const c = Date.now() - t;
  console.log(n, 'includeRuleIds', a + 'ms', 'excludeRuleIds', b + 'ms', 'tags', c + 'ms');
}
