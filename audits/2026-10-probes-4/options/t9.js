const { pack, capture, scan, scanIP } = require('./h.js');
const { mk } = require('./p.js');
const vm = require('node:vm');
function inPage(name, runInPage) {
  const p = pack.definePack(mk({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage }]));
  const s = capture(() => pack.packScript([p]));
  if (!s.ok) return console.log(name, 'packScript THROW', s.msg.slice(0, 200));
  const reg = capture(() => vm.runInThisContext(s.v));
  if (!reg.ok) return console.log(name, 'REGISTRATION THROWS in page:', reg.msg);
  const ip = scanIP({ packs: ['@acme/a11y-rules@1.2.0'] }, ['acme-r']);
  const nd = scan({ packs: [p] }, ['acme-r']);
  const o = (r) => r.ok ? (r.v.checksResults.find((c) => c.ruleId === 'acme-r') || {}) : { outcome: 'THROW ' + r.msg };
  console.log(name, '| page:', o(ip).outcome, String(o(ip).error || '').slice(0, 120), '| node:', o(nd).outcome);
}
const s = Symbol('k'); const o5 = { [s](ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
inPage('symbol-keyed method', o5[s]);
const o6 = { runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } }; Object.defineProperty(o6.runInPage, 'name', { value: 'other' });
inPage('method renamed', o6.runInPage);
const g = Object.getOwnPropertyDescriptor({ get x() { return { outcome: 'fail', occurrences: [] }; } }, 'x').get;
inPage('getter fn', g);
const o3 = { 'quoted name'(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
inPage('quoted method', o3['quoted name']);
const k = 'run'; const o7 = { [k + 'X'](ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
inPage('computed key using outer var', o7.runX);
const o8 = { async runInPage(ctx) { return { outcome: 'fail' }; } };
inPage('async method', o8.runInPage);
const o9 = { runInPage: function named(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } };
inPage('named fn expr', o9.runInPage);
