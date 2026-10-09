'use strict';
// Every documented engineOptions key with values of the wrong type, with and
// without strictOptions. Reports: a throw that isn't INVALID_ENGINE_OPTIONS,
// a silent change of results with no warning, and what strictOptions misses.
const h = require('./h.js');
const { main } = h.load();
const spec = main.__internal && main.__internal.engineOptionSpec ? main.__internal.engineOptionSpec() : require(h.ROOT + '/src/core/engine-options.js').engineOptionSpec();
const PAGE = `<!doctype html><html lang="en"><head><title>T</title></head><body>
<main><h1>Hi</h1><img src="a.png"><button></button><p style="color:#aaa;background:#fff">low</p>
<div id="x" aria-hidden="true"><a href="#">l</a></div><input type="text"></main></body></html>`;

const throwing = {};
Object.defineProperty(throwing, 'mode', { enumerable: true, get() { throw new Error('getter boom'); } });
const proxy = new Proxy({}, { ownKeys() { throw new Error('proxy ownKeys boom'); } });
const protoObj = JSON.parse('{"__proto__":{"polluted":1},"constructor":{"prototype":{"x":1}}}');
const values = {
  null: null, NaN: NaN, Infinity: Infinity, '-1': -1, huge: 1e308, str1: '1', emptyStr: '', emptyArr: [],
  arrObj: [{}], obj: {}, nullProto: Object.create(null), frozen: Object.freeze({ a: 1 }), protoObj,
  throwingGetter: throwing, proxy, fn: () => 1, sym: Symbol('s'), big: 10n, date: new Date(0), true: true
};
const keys = Object.keys(spec);
const base = h.scan(PAGE, { engineOptions: {} });
const baseSum = JSON.stringify(h.summary(base.value));
const rows = [];
for (const key of keys) {
  for (const [vn, v] of Object.entries(values)) {
    const valid = (() => { try { return spec[key].test(v); } catch { return 'test-threw'; } })();
    const r = h.scan(PAGE, { engineOptions: { [key]: v } });
    const s = h.scan(PAGE, { engineOptions: { [key]: v, strictOptions: true } });
    let changed = null;
    if (!r.error) changed = JSON.stringify(h.summary(r.value)) !== baseSum;
    rows.push({
      key, vn, valid,
      plainErr: r.error ? (r.error.code || '') + ':' + String(r.error.message).slice(0, 90) : null,
      plainWarn: r.logs.filter((l) => !/runOnly\.tags: no rules/.test(l)).map((l) => l.slice(0, 110)),
      changed,
      strictErr: s.error ? (s.error.code || 'NOCODE') + ':' + String(s.error.message).slice(0, 110) : null
    });
  }
}
// Interesting rows: crashes without a code, silent change, strict not catching an invalid value.
for (const r of rows) {
  const crash = r.plainErr && !/^INVALID_/.test(r.plainErr);
  const strictMiss = r.valid === false && (!r.strictErr || !/^INVALID_ENGINE_OPTIONS/.test(r.strictErr));
  const strictCrash = r.strictErr && !/^INVALID_/.test(r.strictErr);
  const silent = r.valid === false && r.changed && r.plainWarn.length === 0;
  if (crash || strictMiss || strictCrash || silent)
    console.log(JSON.stringify({ ...r, flags: { crash, strictMiss, strictCrash, silent } }));
}
console.log('rows', rows.length);
process.exit(0);
