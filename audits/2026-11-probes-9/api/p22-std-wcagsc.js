const { definePack, checkPack, standardFromData } = require('@surea11y/core/pack');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderSarifReport } = require('@surea11y/core/sarif');
const data = { format: 'surea11y-standard/1', key: 'zz', standard: 'ZZ Standard', versions: [{ version: '1', wcagVersion: '2.2' }],
  data: { '1': { requirements: { 'R1': { title: 'Images', wcagSc: ['9.9.9'] }, 'R2': { title: 'Page title', wcagSc: ['2.4.2'] } },
    ruleMap: { 'img-alt-present': { requirements: ['R1'] }, 'page-title-present': { requirements: ['R2'] }, 'no-such-rule': { requirements: ['R2'] } } } },
  profiles: { 'zz-1': { version: '1', tags: [] } } };
let std; try { std = standardFromData(data); } catch (e) { console.log('fromData throws', e.message); }
const pack = { name: 'zz-pack', version: '1.0.0', namespace: 'zz', core: '>=1.0.0', standard: { ...std, profiles: { 'zz-1': { version: '1', tags: [], mappedRules: true } } } };
console.log('checkPack:', JSON.stringify(checkPack(pack)).slice(0,600));
let p; try { p = definePack(pack); console.log('definePack ok'); } catch(e) { console.log('definePack throws', e.message.slice(0,300)); }
if (p) {
  const r = runa11yCoreOnHtml('<html lang="en"><body><img src="a.png"></body></html>', { engineOptions: { packs: [p], profile: 'zz-1' } });
  console.log('profile', r.engine.profile, 'skippedPacks', JSON.stringify(r.skippedPacks));
  console.log(r.rulesResults.map(x=>x.ruleId+':'+x.outcome+':'+JSON.stringify(x.meta.normativeMappings.map(m=>m.standard+' '+m.requirement))).join('\n'));
  const img = r.checksResults.find(c=>c.ruleId==='img-alt-present'); console.log('img mappings', JSON.stringify(img.meta.normativeMappings.map(m=>[m.standard,m.requirement,m.wcagSc])));
  const s = JSON.parse(renderSarifReport(r, {packs:[p]})); const rule = s.runs[0].tool.driver.rules.find(x=>x.id==='img-alt-present'); console.log('sarif tags', JSON.stringify(rule && rule.properties.tags));
}
