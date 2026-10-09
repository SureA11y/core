'use strict';
// For each option: which invalid values pass without a strict throw (non-strict:
// neither warning nor error), grouped per key.
const h = require('./h.js');
const spec = require(h.ROOT + '/src/core/engine-options.js').engineOptionSpec();
const PAGE = '<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>x</h1><img src=a.png></main></body></html>';
const values = { null: null, NaN: NaN, '-1': -1, str1: '1', strTrue: 'true', emptyArr: [], obj: {}, num5: 5, true: true, date: new Date(0) };
const out = {};
for (const key of Object.keys(spec)) {
  if (key === 'strictOptions') continue;
  for (const [vn, v] of Object.entries(values)) {
    if (spec[key].test(v)) continue;
    const r = h.scan(PAGE, { engineOptions: { [key]: v }, runOnly: ['img-alt-present', 'page-title-present'] });
    if (!r.error && r.logs.length === 0) (out[key] = out[key] || []).push(vn);
    else if (r.error && !/^INVALID/.test(r.error.code || '')) (out[key + ' CRASH'] = out[key + ' CRASH'] || []).push(vn + ':' + r.error.message.slice(0, 60));
  }
}
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(22), v.join(', '));
process.exit(0);
