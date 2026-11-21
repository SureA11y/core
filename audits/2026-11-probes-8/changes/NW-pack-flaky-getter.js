// A pack whose `rules` getter throws only from its Nth read on: is it skipped, or does the scan / describePacks / checkPack throw?
const { definePack, checkPack, describePacks } = require('/home/user/core-r8/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core-r8/src/testing.js');
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1></main></body></html>';
const base = definePack({ name: 'flaky', version: '1.0.0', namespace: 'fl', core: '*', rules: [{ id: 'fl-rule', meta: { title: 'T', description: 'd', tags: ['fl'] }, runInPage: () => ({ outcome: 'pass' }) }] });
for (const prop of ['rules', 'name', 'standard', 'overrides']) {
  const results = [];
  for (let N = 1; N <= 40; N++) {
    let reads = 0;
    const pack = new Proxy(base, { get(t, k, r) { if (k === prop && ++reads >= N) throw new Error('boom ' + prop); return Reflect.get(t, k, r); } });
    let where = null;
    const w = console.warn; console.warn = () => {};
    try { runa11yCoreOnHtml(html, { runOnly: ['page-has-heading-one'], engineOptions: { packs: [pack] } }); } catch (e) { where = 'scan: ' + e.message.slice(0, 50); }
    console.warn = w;
    if (where) results.push('N=' + N + ' reads=' + reads + ' ' + where);
  }
  console.log(prop, results.length ? results.slice(0, 3).join(' | ') + (results.length > 3 ? ' ... (' + results.length + ' N values throw)' : '') : 'never throws');
}
