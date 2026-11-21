const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const html = '<html><body><img src="x.png"></body></html>';
const warn = console.warn; let warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
for (const locale of ['de','DE','de-DE','de_DE','de-CH-1996','fr-CA','ja-JP','es-419','pt-BR','zh-Hant-TW','', ' de ', 'en-GB','x', null, 42]) {
  warns=[];
  try {
    const r = runa11yCoreOnHtml(html, { engineOptions: { locale }, entryPointParity:false });
    const img = r.checksResults.find(c=>c.ruleId==='img-alt-present');
    console.log(JSON.stringify(locale), JSON.stringify(r.engine.locale), '|', img.occurrences[0].summary.slice(0,60), '|', img.title.slice(0,40), warns.length? 'WARN:'+warns[0].slice(0,150):'');
  } catch(e) { console.log(JSON.stringify(locale),'THROW',e.message.slice(0,200)); }
}
console.warn = warn;
