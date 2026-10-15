const { pack, capture, scanIP } = require('./h.js');
const { mk } = require('./p.js');
const o6 = { runInPage(ctx) { return { outcome: 'fail', occurrences: [{ __node: ctx.document.body }] }; } }; Object.defineProperty(o6.runInPage, 'name', { value: 'other' });
const p = pack.definePack(mk({}, [{ id: 'acme-r', meta: { tags: ['acme'] }, runInPage: o6.runInPage }]));
const s = pack.packScript([p]);
console.log(s.split('\n').filter((l) => l.includes('acme-r')).map((l) => l.slice(0, 200)));
require('node:vm').runInThisContext(s);
const ip = scanIP({ packs: ['@acme/a11y-rules@1.2.0'] });
console.log(ip.ok ? JSON.stringify({ n: ip.v.checksResults.length, acme: ip.v.checksResults.filter(c=>c.ruleId.startsWith('acme')).map(c=>c.ruleId+':'+c.outcome+':'+(c.error||'')), skipped: ip.v.skippedPacks, packs: ip.v.engine.packs }) : ip.msg, ip.warns);
