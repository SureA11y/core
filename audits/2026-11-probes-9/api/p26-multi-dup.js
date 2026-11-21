const { runa11yCoreOnHtml } = require('@surea11y/core/testing');
const { renderJunitReport } = require('@surea11y/core/junit');
const { renderSarifReport } = require('@surea11y/core/sarif');
const html = '<html lang="en"><title>t</title><body><main><h1>x</h1><img src="a.png"></main></body></html>';
const w = console.warn; let warns=[]; console.warn=(...a)=>warns.push(a.join(' '));
for (const profile of [['wcag22-aa','wcag22-aa'], ['wcag22-aa','WCAG22-AA'], ['wcag22-aa', ' wcag21-aa '], ['wcag22-aa','bogus'], [' wcag22-aa '], 'WCAG22-AA', ['wcag22-aa', 'wcag22-aaa']]) {
  warns=[];
  try {
    const t0=Date.now();
    const r = runa11yCoreOnHtml(html, { engineOptions: { profile }, entryPointParity:false });
    const img = r.checksResults.find(c=>c.ruleId==='img-alt-present');
    const j = renderJunitReport(r); let sOk; try { renderSarifReport(r); sOk='ok'; } catch(e){ sOk='sarif throws: '+e.message.slice(0,100); }
    console.log(JSON.stringify(profile), Date.now()-t0+'ms', 'engine.profile', r.engine.profile, 'profiles', JSON.stringify(r.engine.profiles), 'notRun', JSON.stringify(r.engine.profilesNotRun), 'verdicts', JSON.stringify(img.verdicts), 'profilesKeys', r.profiles && Object.keys(r.profiles), sOk, (j.match(/<property name="profiles?" value="[^"]*"/g)||[]).join(' '), warns.length? 'WARN '+warns.join('|').slice(0,200):'');
  } catch (e) { console.log(JSON.stringify(profile), 'THROWS', e.message.slice(0,200)); }
}
console.warn=w;
