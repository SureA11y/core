const { sd, base, mkPack, index, pack, runa11yCoreOnHtml } = require('./lib.js');
const tryIt = (label, fn) => { try { const r = fn(); console.log(label, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { console.log(label, '-> THROWS', e.message.slice(0, 300)); } };
const d = base();
d.laws = { 'pub-act': { name: 'Public Act', jurisdiction: 'FR' }, 'priv-act': { name: 'Private Act', jurisdiction: 'EU' } };
d.texts = { fr: { 'laws.pub-act.name': 'Loi publique' }, 'fr-CA': { 'laws.pub-act.name': 'Loi publique (CA)' } };
d.data[1].requirements.B.laws = ['priv-act'];
d.profiles = { 'base-1': { version: '1', tags: ['base'], mappedRules: true, law: 'pub-act' }, 'base-1-priv': { version: '1', tags: ['base'], mappedRules: true, law: 'priv-act' }, 'base-1-nolaw': { version: '1', tags: ['base'], mappedRules: true } };
const p = mkPack(sd.standardFromData(d));
const reqs = (o) => { const l = index.listProcedures(o); return l && { profile: l.profile, law: l.law && l.law.id, reqs: l.requirements.map((r) => r.id) }; };
tryIt('listProcedures profile with law pub-act', () => reqs({ packs: [p], profile: 'base-1' }));
tryIt('listProcedures profile with law priv-act', () => reqs({ packs: [p], profile: 'base-1-priv' }));
tryIt('listProcedures profile with NO law', () => reqs({ packs: [p], profile: 'base-1-nolaw' }));
tryIt('listProcedures no profile', () => reqs({ packs: [p], standard: 'base' }));
tryIt('listProcedures core profile wcag22-aa with packs', () => { const l = index.listProcedures({ packs: [p], profile: 'wcag22-aa' }); return l === null ? null : { standard: l.standard, n: l.requirements && l.requirements.length }; });
tryIt('listProcedures core profile wcag22-aa, no packs', () => { const l = index.listProcedures({ profile: 'wcag22-aa' }); return l === null ? null : { standard: l.standard, n: (l.requirements || l.criteria || []).length }; });
tryIt('lawOf fr', () => pack.lawOf(p.standard, 'pub-act', 'fr'));
tryIt('lawOf fr-CA', () => pack.lawOf(p.standard, 'pub-act', 'fr-CA'));
tryIt('lawOf fr-BE', () => pack.lawOf(p.standard, 'pub-act', 'fr-BE'));
tryIt('lawOf priv in fr (missing translation -> fallback)', () => pack.lawOf(p.standard, 'priv-act', 'fr'));
tryIt('lawOf unknown', () => pack.lawOf(p.standard, 'nope', 'fr'));
tryIt('lawOf __proto__', () => pack.lawOf(p.standard, '__proto__', 'fr'));
tryIt('lawOf(pack) instead of pack.standard', () => pack.lawOf(p, 'pub-act', 'fr'));
tryIt('lawOf with locale array', () => pack.lawOf(p.standard, 'pub-act', ['fr']));
const html = '<!doctype html><html lang="en"><head><title>t</title></head><body><main><img src="a.png"></main></body></html>';
for (const profile of ['base-1', 'base-1-nolaw', ['base-1', 'base-1-priv']]) {
  const r = runa11yCoreOnHtml(html, { engineOptions: { packs: [p], profile, locale: 'fr' } });
  console.log('scan', JSON.stringify(profile), 'engine.law =', JSON.stringify(r.engine.law), ' profiles law =', JSON.stringify(r.engine.profiles && r.engine.profiles.map && r.engine.profiles.map((x) => x.law)));
}
