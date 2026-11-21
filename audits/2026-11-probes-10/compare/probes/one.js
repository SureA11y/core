// usage: node one.js '<html snippet>' [ruleIdRegex]  -> core occurrences in Chromium
const { chromium } = require('/home/user/core-r10/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
 const html=process.argv[2].startsWith('<!doctype')?process.argv[2]:'<!doctype html><html lang="en"><head><title>T</title></head><body><main>'+process.argv[2]+'</main></body></html>';
 await p.setContent(html); await p.addScriptTag({path:'/home/user/core-r10/surea11y.browser.js'});
 const re=new RegExp(process.argv[3]||'.');
 const r=await p.evaluate(async()=>{const res=await window.a11ycore.runa11yCoreInPage(null,null,{},null);return res.checksResults.map(c=>({id:c.ruleId,outcome:c.outcome,occ:c.occurrences.map(o=>({sel:o.selector,oo:o.occurrenceOutcome,sum:o.summary,u:o.uncertainty&&o.uncertainty.code,lean:o.lean&&{t:o.lean.toward,why:o.lean.why},reason:o.data&&o.data.details&&o.data.details.reasonCode}))}));});
 for(const c of r) if(re.test(c.id)&&c.outcome!=='notApplicable') console.log(JSON.stringify(c,null,1));
 if(process.argv[4]){const cdp=await p.context().newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');for(const n of nodes){if(n.ignored)continue;console.log('AX',n.role&&n.role.value,JSON.stringify(n.name&&n.name.value||''),(n.properties||[]).filter(x=>['focusable','hidden'].includes(x.name)).map(x=>x.name).join(','));}}
 await b.close();})();
