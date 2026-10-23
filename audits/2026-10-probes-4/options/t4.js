const { scan, scanIP, brief, pack, core } = require('./h.js');
const { mk, version } = require('./p.js');
const out = (name, r, pick) => console.log(name, r.ok ? String(JSON.stringify(pick ? pick(r.v) : { packs: r.v.engine.packs, skipped: r.v.skippedPacks })).slice(0, 500) : 'THROW[' + (r.code || 'nocode') + '] ' + r.msg, JSON.stringify(r.warns.slice(0, 2)).slice(0, 300));
const ruleRes = (id) => (v) => { const c = v.checksResults.find((c) => c.ruleId === id); return c ? { o: c.outcome, e: c.error && String(c.error).slice(0, 200), n: c.occurrences && c.occurrences.length } : 'absent'; };
// 1. pack proxies / getters
const throwProxy = new Proxy({}, { ownKeys() { throw new Error('PACK_OWNKEYS'); }, get() { throw new Error('PACK_GET'); } });
out('proxyPack', scan({ packs: [throwProxy] }));
out('proxyPackDescribe', require('./h.js').capture(() => pack.describePacks([throwProxy])), (v) => v);
out('proxyPackCheck', require('./h.js').capture(() => pack.checkPack(throwProxy)), (v) => v);
let n = 0;
const flip = mk({ get rules() { n++; return n > 3 ? 5 : [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { return { outcome: 'pass' }; } }]; } });
let dp; out('flipDefine', require('./h.js').capture(() => (dp = pack.definePack(flip))), () => 'ok');
out('flipScan', scan({ packs: [flip] }));
// rules array with holes / null
out('rulesHoles', scan({ packs: [mk({ rules: [, , ] })] }));
out('rulesNull', scan({ packs: [mk({ rules: [null] })] }));
out('rulesSparseValid', scan({ packs: [mk({}, [, { id: 'acme-r', meta: { tags: ['acme'] }, runInPage() { return { outcome: 'pass' }; } }])] }));
// rule return garbage
const R = (id, fn, meta = {}) => ({ id, meta: { title: id, ...meta }, runInPage: fn });
const garbage = {
  'acme-undef': () => undefined,
  'acme-num': () => 42,
  'acme-arr': () => [],
  'acme-occ-huge': (ctx) => ({ outcome: 'fail', occurrences: Array.from({ length: 50000 }, () => ({ __node: ctx.document.body })) }),
  'acme-cyclic': () => { const o = { outcome: 'fail' }; o.self = o; o.occurrences = [{ details: o }]; return o; },
  'acme-throw-sym': () => { throw Symbol('s'); },
  'acme-throw-null': () => { throw null; },
  'acme-throw-proxy': () => { throw new Proxy({}, { get() { throw new Error('x'); } }); },
  'acme-mutate': (ctx) => { ctx.document.body.appendChild(ctx.document.createElement('img')); return { outcome: 'pass' }; },
  'acme-async': async () => ({ outcome: 'pass' }),
  'acme-outcome-proto': () => ({ outcome: '__proto__' }),
  'acme-outcome-tostring': () => ({ outcome: 'toString' }),
  'acme-sev-proto': () => ({ outcome: 'fail', severity: '__proto__', occurrences: [{}] }),
  'acme-occ-proto': () => JSON.parse('{"outcome":"fail","occurrences":[{"__proto__":{"selector":"x"},"summary":"s"}]}'),
  'acme-bigdata': () => ({ outcome: 'pass', data: { s: 'x'.repeat(5e6) } }),
  'acme-deepdata': () => { let o = {}; const root = o; for (let i = 0; i < 1e5; i++) { o.c = {}; o = o.c; } return { outcome: 'pass', data: root }; },
  'acme-thenable': () => ({ outcome: 'pass', then(r) { r(1); } }),
  'acme-tojson': () => ({ outcome: 'pass', data: { toJSON() { throw new Error('tojson'); } } }),
  'acme-getter-outcome': () => ({ get outcome() { return Math.random() > 2 ? 'x' : 'fail'; }, occurrences: [] }),
};
const rules = Object.entries(garbage).map(([id, fn]) => R(id, fn, { tags: ['acme'] }));
const p = pack.definePack(mk({}, rules));
const ids = Object.keys(garbage);
const t = Date.now();
const r = scan({ packs: [p] }, ids);
console.log('garbage scan ms', Date.now() - t);
if (r.ok) { for (const id of ids) out(id, r, ruleRes(id)); try { JSON.stringify(r.v); console.log('JSON ok', JSON.stringify(r.v).length); } catch (e) { console.log('JSON FAIL', e.message); } try { structuredClone(r.v); console.log('clone ok'); } catch (e) { console.log('clone FAIL', e.message); } }
else out('garbage', r);
console.log('warns', r.warns.slice(0, 6));
