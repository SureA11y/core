const L = require('./lib'); const { core } = L;
const mk = (id, body) => ({ id, meta: { title: id, description: id, wcagSc: ['1.1.1'], tags: ['org'] }, runInPage: `function (ctx) { ${body} }` });
for (const [name, body] of [
  ['throws', "throw new Error('boom');"],
  ['null', 'return null;'],
  ['bogus', "return { ruleId: ctx.rule.ruleId, outcome: 'bogus', occurrences: [] };"],
  ['async', "return Promise.resolve({ ruleId: ctx.rule.ruleId, outcome: 'fail', occurrences: [] });"],
  ['wrongid', "return { ruleId: 'other', outcome: 'fail', occurrences: [] };"],
  ['syntax', "return {"],
]) {
  const eo = { customRules: [mk('org-' + name, body)] };
  const ro = { includeRuleIds: ['org-' + name] };
  const s = L.scan(ro, eo);
  const g = L.capture(() => core.getRulesForRunOnly(ro, eo));
  if (s.error) { console.log(name, 'THROW', s.error.message); continue; }
  const v = s.value;
  const after = v && typeof v.then === 'function' ? 'PROMISE' : null;
  if (after) { console.log(name, 'scan returned promise'); continue; }
  console.log(name.padEnd(8), 'checks:', v.checksResults.map((c) => c.ruleId + ':' + c.outcome).join(','), '| rollups:', v.rulesResults.map((r) => r.ruleId + ':' + r.outcome).join(','), '| list:', g.value.map((x) => x.id).join(','), '| skipped:', JSON.stringify(v.skippedCustomRules || []).slice(0, 150));
}
