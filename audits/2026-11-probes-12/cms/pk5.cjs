const {createRequire}=require('module'); const R=createRequire('/home/user/pack-raweb/index.js');
const {runa11yCoreOnHtml}=R('@surea11y/core/testing');
const rgaa=R('@surea11y/pack-rgaa'), raweb=R('/home/user/pack-raweb/index.js');
const Rw=createRequire('/home/user/pack-wai-aria/index.js'); const aria=Rw('/home/user/pack-wai-aria/index.js');
const Re=createRequire('/home/user/pack-en301549/index.js'); const en=Re('/home/user/pack-en301549/index.js');
const html='<!doctype html><html lang="fr"><head><title>Accueil</title></head><body><main><h1>Bonjour</h1><img src="a.png"><div role="grid"></div><ul role="navigation"><li><a href="/">x</a></li></ul></main></body></html>';
const cases=[['raweb',[rgaa,raweb],'raweb-1.1'],['rgaa',[rgaa],'rgaa-4.1.2'],['aria',[aria],'wai-aria-1.2'],['en',[en],'en301549-v4.1.1']];
const rep=R('@surea11y/core/report'), sarif=R('@surea11y/core/sarif'), junit=R('@surea11y/core/junit'), earl=R('@surea11y/core/earl');
for (const [n,packs,profile] of cases){
 const r=runa11yCoreOnHtml(html,{engineOptions:{packs,profile}});
 const outs={};
 const fns={html:Object.values(rep).find(f=>typeof f==='function'&&/html/i.test(f.name))||rep.toHtmlReport||rep.renderHtmlReport, sarif:Object.values(sarif).find(f=>typeof f==='function'), junit:Object.values(junit).find(f=>typeof f==='function'), earl:Object.values(earl).find(f=>typeof f==='function')};
 for (const [k,f] of Object.entries(fns)){ try{ let o=f(r); if(typeof o!=='string') o=JSON.stringify(o); outs[k]=packs.map(p=>p.name+'@'+p.version).map(s=>o.includes(s)?'Y':'N').join('')+' ('+(f.name)+')'; }catch(e){outs[k]='ERR '+e.message.slice(0,100)} }
 console.log(n, profile, 'skipped',JSON.stringify(r.skippedPacks||[]), 'packs in result', JSON.stringify(r.packs||r.engine&&r.engine.packs||'').slice(0,200), JSON.stringify(outs));
}
{const r=runa11yCoreOnHtml(html,{engineOptions:{packs:[rgaa,raweb],profile:'raweb-1.1'}});
const h=rep.renderHtmlReport(r); const i=h.search(/pack-r/); console.log('HTML around pack:', i, h.slice(Math.max(0,i-300),i+300).replace(/\s+/g,' '));
const e=JSON.stringify(earl.renderEarlReport(r)); const j=e.search(/pack-r/); console.log('EARL', j, e.slice(Math.max(0,j-200),j+200));}
{const r=runa11yCoreOnHtml('<!doctype html><html lang="fr"><head><title>Accueil</title></head><body><main><h1>Bonjour</h1><ul role="navigation"><li><a href="/">x</a></li></ul><p><b>Horaires</b></p><p>Ouvert tous les jours de 9 h à 17 h sauf les jours fériés.</p></main></body></html>',{engineOptions:{packs:[rgaa,raweb],profile:'raweb-1.1',locale:'fr'}});
for (const c of r.checksResults.filter(c=>c.outcome==='cantTell'&&/listitem|p-as/.test(c.ruleId))) for (const o of c.occurrences.slice(0,1)) console.log('RAWEB',c.ruleId, JSON.stringify(o.howToCheck||o.review||'').slice(0,500));}
{const r=runa11yCoreOnHtml('<!doctype html><html lang="fr"><head><title>Accueil</title></head><body><main><h1>Bonjour</h1><ul role="navigation"><li><a href="/">x</a></li></ul></main></body></html>',{engineOptions:{packs:[rgaa,raweb],profile:'raweb-1.1',locale:'fr',output:{detail:'findings'}}});
const c=r.checksResults.find(c=>c.ruleId==='listitem-parent-valid'); console.log('RAWEB2',c.outcome,JSON.stringify(c.occurrences[0]).slice(0,1500));
const H=R('@surea11y/core/how-to-check'); console.log('RAWEB3',Object.keys(H));}
