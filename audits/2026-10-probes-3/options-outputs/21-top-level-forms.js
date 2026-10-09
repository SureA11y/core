'use strict';
// engineOptions and runOnly given as odd top-level values: a string, an
// array, a number, a frozen object, a null-prototype object, a Proxy that
// counts reads, a class instance; and whether a scan mutates what it's given.
const h = require('./h.js');
const { main } = h.load();
const PAGE = '<!doctype html><html lang="en"><head><title>t</title></head><body><img src="a.png"></body></html>';
let reads = 0;
const counted = new Proxy({ locale: 'de' }, { get(t, k, r) { reads++; return Reflect.get(t, k, r); } });
class Opts { constructor() { this.locale = 'fr'; } get wcagVersion() { return '2.1'; } }
const forms = {
  string: 'de', array: ['de'], number: 5, true: true, frozen: Object.freeze({ locale: 'de', output: Object.freeze({ detail: 'findings' }) }),
  nullProto: Object.assign(Object.create(null), { locale: 'ja' }), proxy: counted, classInstance: new Opts(),
  'strict + array': Object.assign(['x'], { strictOptions: true })
};
for (const [name, eo] of Object.entries(forms)) {
  const before = JSON.stringify(eo);
  const r = h.scan(PAGE, { engineOptions: eo, runOnly: ['img-alt-present'] });
  const after = JSON.stringify(eo);
  console.log(name.padEnd(15), r.error ? 'THROWS ' + r.error.message.slice(0, 100) : `locale ${r.value.engine.locale.resolved} wcag ${r.value.engine.wcagVersion} detail ${r.value.engine.outputDetail || 'full'}`, '| mutated:', before !== after, '| logs:', r.logs.map((l) => l.slice(0, 80)).join('|'));
}
console.log('proxy property reads during one scan:', reads);
// runOnly forms
for (const [name, ro] of Object.entries({ frozen: Object.freeze({ includeRuleIds: Object.freeze(['img-alt-present']) }), nullProto: Object.assign(Object.create(null), { includeRuleIds: ['img-alt-present'] }), 'Map': new Map([['includeRuleIds', ['img-alt-present']]]), 'function': () => 1, 'Date': new Date() })) {
  const r = h.scan(PAGE, { runOnly: ro });
  console.log('runOnly', name.padEnd(9), r.error ? 'THROWS ' + (r.error.code || '') + ' ' + r.error.message.slice(0, 90) : 'ran ' + r.value.checksResults.length, r.logs.length ? '| ' + r.logs.join('|').slice(0, 90) : '');
}
process.exit(0);
