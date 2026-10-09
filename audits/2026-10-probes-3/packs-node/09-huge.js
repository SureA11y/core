'use strict';
// A pack with N trivial rules: prepare time, scan time, and catalog calls.
const { scan, quiet, base, packApi, main } = require('./lib.js');
const N = Number(process.argv[2] || 5000);
const rules = Array.from({ length: N }, (_, i) => ({ id: `h-r${i}`, meta: { title: `r${i}`, wcagSc: i % 2 ? ['1.3.1'] : [] }, runInPage: () => ({ outcome: 'pass' }) }));
const pack = base({ name: 'huge', namespace: 'h', rules });
let t = Date.now();
const e = packApi.preparePacks([pack]);
console.log(`N=${N} prepare ${Date.now() - t}ms; checkDefs ${e.catalog.checkDefs.length}`);
t = Date.now();
const r = quiet(() => scan({ packs: [pack] })).r;
console.log(`scan ${Date.now() - t}ms; results ${r.checksResults.length}; json ${Math.round(JSON.stringify(r).length / 1e6)}MB`);
t = Date.now();
main.getChecksCatalog({ packs: [pack] });
console.log(`catalog ${Date.now() - t}ms (cached engine)`);
t = Date.now();
const s = packApi.packScript([pack]);
console.log(`packScript ${Date.now() - t}ms, ${Math.round(s.length / 1e3)}KB`);
