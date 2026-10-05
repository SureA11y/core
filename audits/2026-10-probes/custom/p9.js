const h = require('./h');
delete require.cache[require.resolve('/home/user/core/src/index.js')];
const core = require('/tmp/scratchpad/custom/corecopy/src/index.js');
const { setup } = h; setup();
const ow=console.warn; const w=[]; console.warn=(...a)=>w.push(a.join(' '));
for (const p of ['section508','section508-1.0','foo-std-1.0']) {
  const r = core.runDomRulesInPage('u', null, { profile: p }, null);
  console.log(p, '->', r.engine.profile, r.engine.wcagVersion, JSON.stringify(r.engine.mappings), 'rollups', r.rulesResults.filter(x=>/section508|foo/.test(x.ruleId)).length, 'checks', r.checksResults.length);
}
const r = core.runDomRulesInPage('u', null, { mappings:['section508'] }, null);
console.log('mappings section508:', JSON.stringify(r.engine.mappings), w.join('|'));
console.log('rules catalog section508:', core.getRulesCatalog({profile:'section508'}).filter(x=>/section508/.test(x.id)).length);
