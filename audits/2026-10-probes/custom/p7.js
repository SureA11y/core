const { run, pick, core } = require('./h');
const clean = `<!doctype html><html lang="en"><head><title>T</title></head><body><main><h1>Hi</h1><img src="x.png" alt="logo"></main></body></html>`;
let o = run({ customRules:[{ id:'z', meta:{tags:['wcag2a','wcag111'], normativeMappings:[{standard:'WCAG',version:'2.2',requirement:'1.1.1',title:'Non-text Content'}]}, runInPage:(ctx)=>({outcome:'fail',occurrences:[{__node:ctx.document.querySelector('img'), summary:'bad alt'}]}) }] }, null, null, clean);
const c = o.res.rulesResults.find(r=>r.ruleId==='wcag-1.1.1-non-text-content'); console.log('clean page: custom', pick(o.res,'z').outcome, 'composite 1.1.1', c.outcome);
// i18n
const i18nRule = { id:'z', meta:{ title:'English title', i18n:{titleKey:'z_title', descriptionKey:'z_desc'} }, runInPage:(ctx)=>({outcome:'fail',occurrences:[{__node:ctx.document.querySelector('img'), summary:'Eng', i18n:{summaryKey:'z_sum', params:{n:3}}}]}) };
for (const loc of ['en','de','fr']) {
  o = run({ locale: loc, messages:{ de:{ z_title:'Deutscher Titel', z_sum:'Zusammenfassung {n}' }, en:{z_title:'EN override'} }, customRules:[i18nRule] }, ['z'], null, clean);
  const r = pick(o.res,'z'); console.log(loc, r.title, '|', r.occurrences[0].summary, '|', JSON.stringify(o.res.engine.locale));
}
// catalogs
const eo = { customRules:[{ id:'z', meta:{title:'Z'}, runInPage:'(c)=>({outcome:"pass",occurrences:[]})' }] };
console.log('getChecksCatalog has z:', core.getChecksCatalog(eo).some(r=>r.ruleId==='z'), 'getCheckDefById:', core.getCheckDefById('z', eo), 'getChecksForRunOnly:', core.getChecksForRunOnly(['z'], eo).map(r=>r.ruleId), 'getTestsForRunOnly', core.getTestsForRunOnly({includeRuleIds:['z']}, eo).length);
// determinism
o = run({ timestamp:'2026-01-01T00:00:00Z', customRules:[i18nRule] }, null, null, clean);
const o2 = run({ timestamp:'2026-01-01T00:00:00Z', customRules:[i18nRule] }, null, null, clean);
console.log('deterministic:', JSON.stringify(o.res)===JSON.stringify(o2.res));
// customRules echoed in engineOptions? function survives JSON?
const r = pick(o.res,'z'); console.log('echo has customRules:', 'customRules' in r.engineOptions, typeof (r.engineOptions.customRules||[])[0]?.runInPage, JSON.stringify(r.engineOptions).length);
// non-array customRules
o = run({ customRules: { id:'z', meta:{}, runInPage:(c)=>({outcome:'pass',occurrences:[]}) } }, null, null, clean);
console.log('customRules as object: ran z?', !!pick(o.res,'z'), o.warns);
