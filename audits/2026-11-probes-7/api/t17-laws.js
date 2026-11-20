const mk = require('./lawpack.js');
const P = require('/home/user/core/src/pack.js');
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  let pack; try { pack = mk(); } catch (e) { console.log('define throws', e.message); return; }
  console.log('checkPack', JSON.stringify(P.checkPack(pack)));
  console.log('lawOf fr-CA', JSON.stringify(P.lawOf(pack.standard, 'sample-law-a', 'fr-CA')), 'FR-ca', JSON.stringify(P.lawOf(pack.standard, 'sample-law-a', 'FR-ca')), 'fr', JSON.stringify(P.lawOf(pack.standard, 'sample-law-a', 'fr')), 'en', JSON.stringify(P.lawOf(pack.standard, 'sample-law-a')));
  console.log('describe', JSON.stringify(P.describePacks([pack])).slice(0, 800));
  const html = require('./page.js');
  for (const [profile, locale] of [['sample-1.0', 'fr-CA'], [['sample-1.0', 'sample-2.0a'], 'fr-ca'], [['sample-1.0', 'sample-2.0'], 'en'], [['sample-1.0', 'wcag22-aa'], 'en'], [['wcag22-aa', 'sample-1.0'], 'ja']]) {
    const r = await runa11yCoreOnHtml(html, { engineOptions: { packs: [pack], profile, locale } }); await tick();
    console.log(JSON.stringify(profile), locale, 'engine.law', JSON.stringify(r.engine.law), 'sections', r.profiles ? JSON.stringify(Object.fromEntries(Object.entries(r.profiles).map(([k, v]) => [k, v.law]))) : '-');
  }
})();
