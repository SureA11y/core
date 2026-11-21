const { checkPack, definePack } = require('@surea11y/core/pack');
const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const basePack = () => ({ name: 'zz-pack', version: '1.0.0', namespace: 'zz', core: '>=1.0.0', title: 'ZZ',
  profiles: { 'zz-p': { tags: [], rules: ['img-alt-present'] } }, rollups: [{ id: 'zz-r', title: 'R', checksIds: ['img-alt-present'] }] });
const muts = {
  ok: p=>p,
  profileUnknownRule: p=>{ p.profiles['zz-p'].rules=['img-alt-presnt']; },
  profileSeverityUnknownRule: p=>{ p.profiles['zz-p'].severity={'nope-rule':'critical'}; },
  profileSeverityBad: p=>{ p.profiles['zz-p'].severity={'img-alt-present':'urgent'}; },
  profileExcludeUnknown: p=>{ p.profiles['zz-p'].exclude={rules:['nope-rule']}; },
  profileUnknownTag: p=>{ p.profiles['zz-p'].tags=['wcag2zz']; },
  rollupUnknownCheck: p=>{ p.rollups[0].checksIds=['nope-rule']; },
  rollupEmpty: p=>{ p.rollups[0].checksIds=[]; },
  profileWcagVersionBad: p=>{ p.profiles['zz-p'].wcagVersion='3.0'; },
  profileUnknownKey: p=>{ p.profiles['zz-p'].rule=['img-alt-present']; },
};
for (const [k, m] of Object.entries(muts)) {
  const p = basePack(); m(p);
  let cp; try { cp = checkPack(p); } catch(e) { cp=['THROWS '+e.message]; }
  let dp; try { dp = definePack(p); } catch(e) { dp = null; }
  let scan='';
  if (dp) { const w=console.warn; const ws=[]; console.warn=(...a)=>ws.push(a.join(' ')); try { const r = runa11yCoreOnHtml('<html lang=en><title>t</title><img src=a.png></html>', { engineOptions: { packs: [dp], profile: 'zz-p' }, entryPointParity:false }); scan = `profile=${r.engine.profile} skipped=${JSON.stringify(r.skippedPacks||[]).slice(0,160)} n=${r.checksResults.length}`; } catch(e) { scan='scan throws '+e.message.slice(0,120);} console.warn=w; if (ws.length) scan += ' WARN '+ws.join('|').slice(0,160); }
  console.log(k.padEnd(28), 'checkPack', cp.length?JSON.stringify(cp).slice(0,150):'[]', '| definePack', dp?'ok':'throws', '|', scan);
}
