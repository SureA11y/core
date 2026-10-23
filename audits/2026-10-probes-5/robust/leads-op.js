// Round-4 option leads: OP-P2 (strict catches unknown profile/mappings/optInRules/bad CSS), OP-P3 (non-boolean applicability), OP-P1 (throwing Proxy in describePacks).
const { capture, scan, pack } = require('./r4/options/h.js');
const { mk } = require('./r4/options/p.js');
for (const eo of [{ profile: 'wcag22-aaa-typo' }, { mappings: ['nope'] }, { optInRules: ['nope'] }, { excludeSelectors: ['div[[['] }]) {
  const r = scan({ strictOptions: true, ...eo });
  console.log('OP-P2 strict', JSON.stringify(eo), r.ok ? 'NO THROW, warns=' + JSON.stringify(r.warns).slice(0, 160) : 'throws ' + r.code);
}
for (const v of [undefined, 0, NaN, 'false', null]) {
  const rule = { id: 'org-x', meta: { tags: ['org'] }, applicability: () => v, runInPage: (ctx) => ({ outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }) };
  const r = scan({ customRules: [rule] }, ['org-x']);
  const c = r.ok && r.v.checksResults.find(c => c.ruleId === 'org-x');
  console.log('OP-P3 applicability ->', String(v), r.ok ? c.outcome + ' ' + String(c.error || '').slice(0, 100) + ' warns=' + r.warns.length : r.msg);
}
const prox = new Proxy({}, { ownKeys() { throw new Error('PACK_OWNKEYS'); } });
const d = capture(() => pack.describePacks([prox]));
console.log('OP-P1 describePacks(throwing proxy):', d.ok ? JSON.stringify(d.v).slice(0, 200) : 'THROWS ' + d.msg.slice(0, 100));
