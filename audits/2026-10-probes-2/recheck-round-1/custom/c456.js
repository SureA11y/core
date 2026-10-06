const { scan, cr } = require('./h');
const cases = {
  undef: '(ctx) => undefined', nul: '(ctx) => null', str: "(ctx) => 'pass'", num: '(ctx)=>5', arr: '(ctx)=>[]',
  asyncFn: "async (ctx) => ({ outcome: 'pass', occurrences: [] })",
  failed: "(ctx) => ({ outcome: 'failed', occurrences: [] })",
  inapplicable: "(ctx) => ({ outcome: 'inapplicable', occurrences: [] })",
  PASS: "(ctx) => ({ outcome: 'PASS', occurrences: [] })",
};
for (const [k, s] of Object.entries(cases)) for (const entry of ['node','inpage']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, runInPage: s }] }, ['z'], entry);
  const r = cr(o.res, 'z');
  console.log(k, entry, r ? r.outcome + ' | error=' + JSON.stringify(r.error) : 'MISSING');
}
// async applicability resolving false
for (const entry of ['node','inpage']) {
  const o = scan(null, { customRules: [{ id: 'z', meta: {}, applicability: 'async () => false', runInPage: "(ctx) => ({ outcome: 'fail', occurrences: [{message:'x'}] })" }] }, ['z'], entry);
  const r = cr(o.res, 'z');
  console.log('asyncApplicability', entry, r && r.outcome, JSON.stringify(r && r.error), o.warns);
}
