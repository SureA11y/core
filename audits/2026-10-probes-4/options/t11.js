const { scan } = require('./h.js');
const writer = (id) => ({ id, meta: { tags: ['x'] }, runInPage(ctx) { ctx.window.__order = (ctx.window.__order || []).concat(ctx.rule.id); return { outcome: 'pass', data: { seen: ctx.window.__order.slice() } }; } });
const order = (list) => { const r = scan({ customRules: list }, { tags: ['x'] }); return r.ok ? r.v.checksResults.map((c) => c.ruleId + '=' + JSON.stringify(c.data && c.data.seen)).join(' ') : r.msg; };
console.log(order([writer('zz-b'), writer('aa-a')]));
console.log(order([writer('aa-a'), writer('zz-b')]));
console.log(order([writer('B-upper'), writer('a-lower')]));
for (const n of [1e5, 3e5]) {
  const t = Date.now();
  const r = scan({ customRules: [{ id: 'x-many', meta: { tags: ['x'] }, runInPage(ctx) { const b = ctx.document.body; const occ = []; for (let i = 0; i < n; i++) occ.push({ __node: b }); return { outcome: 'fail', occurrences: occ }; } }] }, ['x-many']);
  console.log('occ', n, Date.now() - t, 'ms', r.ok ? r.v.checksResults[0].occurrences.length : r.msg);
}
for (const n of [1e4, 5e4]) {
  const html = '<!doctype html><html lang=en><head><title>t</title></head><body>' + '<span class=s>x</span>'.repeat(n) + '</body></html>';
  const t = Date.now();
  const r = scan({ customRules: [{ id: 'x-distinct', meta: { tags: ['x'] }, runInPage(ctx) { return { outcome: 'fail', occurrences: Array.from(ctx.document.querySelectorAll('.s'), (e) => ({ __node: e })) }; } }] }, ['x-distinct'], html);
  console.log('distinct occ', n, Date.now() - t, 'ms', r.ok ? r.v.checksResults[0].occurrences.length + ' ' + r.v.checksResults[0].occurrences[n - 1].selector : r.msg);
}
