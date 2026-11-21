const { checkPack, definePack, describePacks } = require('@surea11y/core/pack');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const base = require('./gen/acme-a11y/rules/automatic/acme-contrast-enhanced.js');
console.log('base keys', Object.keys(base), 'runInPage?', typeof base.runInPage);
for (const from of ['no-such-rule', 'img-alt-present', 'Contrast-Minimum', 'wcag-1.4.3-contrast-minimum']) {
  const pack = { name: 'zz-pack', version: '1.0.0', namespace: 'zz', core: '>=1.0.0', rules: [{ id: 'zz-v', from, config: {}, meta: { title: 'V', description: 'V', tags: ['zz'], wcagSc: ['1.4.3'], type:'automatic' } }] };
  console.log('from', from, 'checkPack:', JSON.stringify(checkPack(pack)));
  let p; try { p = definePack(pack); } catch (e) { console.log('  definePack throws', e.message.slice(0,200)); continue; }
  console.log('  describe', JSON.stringify(describePacks([p])[0].variants), JSON.stringify(describePacks([p])[0].rules));
  const r = runa11yCoreOnHtml('<html lang="en"><title>t</title><body><p style="color:#999">x</p><img src=a.png></body></html>', { engineOptions: { packs: [p], optInRules: 'all' } });
  const c = r.checksResults.find(c => c.ruleId === 'zz-v');
  console.log('  scan:', c ? `${c.outcome} occ=${c.occurrences.length} variantOf=${c.variantOf} err=${(c.error||'').slice(0,120)}` : 'no result', 'skippedPacks', JSON.stringify(r.skippedPacks));
}
