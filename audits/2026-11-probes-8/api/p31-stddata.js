const F = '/tmp/surea11y-audit/scratch/family/';
const P = require('/home/user/core-r8/src/pack.js');
const ps = ['pack-rgaa', 'pack-raweb', 'pack-en301549', 'pack-wai-aria'].map(n => require(F + n));
for (const p of ps) {
  const d = P.standardDataOf(p.standard);
  console.log(p.name, 'data?', !!d, d && Object.keys(d).join(','), d && JSON.stringify(P.checkStandardData(d)).slice(0, 200));
}
const d = P.standardDataOf(ps[0].standard);
if (d) {
  const clone = JSON.parse(JSON.stringify(d));
  console.log('roundtrip check', JSON.stringify(P.checkStandardData(clone)).slice(0, 200));
  let st; try { st = P.standardFromData(clone); console.log('standardFromData ok', Object.keys(st).slice(0, 12).join(',')); } catch (e) { console.log('standardFromData THROW', e.message.slice(0, 300)); }
  // hostile
  const hostile = {
    protoKey: JSON.parse(JSON.stringify(d).replace('"key":"rgaa"', '"key":"__proto__"')),
    nullData: null, str: 'x', arr: [], deep: (() => { const o = {}; let c = o; for (let i = 0; i < 20000; i++) { c.a = {}; c = c.a; } return o; })(),
    cyc: (() => { const o = JSON.parse(JSON.stringify(d)); o.self = o; return o; })(),
    getter: (() => { const o = JSON.parse(JSON.stringify(d)); Object.defineProperty(o, 'versions', { get() { throw new Error('g'); }, enumerable: true }); return o; })(),
    proxy: new Proxy(JSON.parse(JSON.stringify(d)), { ownKeys() { throw new Error('ok'); } }),
  };
  for (const [k, v] of Object.entries(hostile)) {
    let a, b; try { a = JSON.stringify(P.checkStandardData(v)).slice(0, 120); } catch (e) { a = 'THROW ' + e.constructor.name + ' ' + e.message.slice(0, 80); }
    try { P.standardFromData(v); b = 'ok'; } catch (e) { b = 'THROW ' + e.constructor.name + ' ' + e.message.slice(0, 80); }
    console.log(k.padEnd(9), 'check:', a, '| from:', b);
  }
  // deriveStandard hostile
  for (const [k, args] of Object.entries({ noBases: [[], { format: 'surea11y-standard/1' }], nullOwn: [[clone], null], selfBase: [[clone], clone], protoBased: [[clone], { ...clone, key: 'x', basedOn: { key: '__proto__' } }] })) {
    let x; try { x = P.deriveStandard(...args); x = 'ok ' + Object.keys(x).join(','); } catch (e) { x = 'THROW ' + e.constructor.name + ' ' + e.message.slice(0, 150); }
    console.log('derive', k, x.slice(0, 200));
  }
}
