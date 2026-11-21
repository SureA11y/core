const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const html = `<html lang="en"><title>t</title><body><main><h1>x</h1>
<img id="a,b" src="1.png"><img data-x="p,q" src="2.png"><img class="k" src="3.png"><img title="z" src="4.png"><img id="c" src="5.png"></main></body></html>`;
const w = console.warn; let warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
for (const ex of ['#a\\,b', '[data-x="p,q"]', "img:is(.k, [title=z])", '#c,', ', #c', '#c ,, .k', ['#c', ''], '#c\\', 'img:not(#c', ' ']) {
  warns=[];
  try {
    const r = runa11yCoreOnHtml(html, { engineOptions: { excludeSelectors: ex }, entryPointParity:false });
    const c = r.checksResults.find(c=>c.ruleId==='img-alt-present');
    console.log(JSON.stringify(ex), '=> remaining', c.occurrences.map(o=>o.html.match(/src="(\d)/)[1]).join(','), warns.length?'WARN '+warns.join('|').slice(0,200):'');
  } catch(e) { console.log(JSON.stringify(ex), 'THROWS', e.message.slice(0,200)); }
  try { runa11yCoreOnHtml(html, { engineOptions: { excludeSelectors: ex, strictOptions: true }, entryPointParity:false }); console.log('   strict ok'); } catch(e) { console.log('   strict THROWS', e.message.slice(0,200)); }
}
console.warn=w;
