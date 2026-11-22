const {chromium}=require('/tmp/surea11y-audit/r12/cms/wt/node_modules/playwright-core');
const B='/tmp/surea11y-audit/r12/cms/wt/plugins/wordpress/build/';
const locale=process.argv[2]||'en', width=+(process.argv[3]||600), dark=process.argv[4]==='dark';
(async()=>{
 const br=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
 const pg=await br.newPage({viewport:{width,height:900},colorScheme:dark?'dark':'light'});
 const reqs=[]; pg.on('request',r=>{ if(!r.url().startsWith('file:')) reqs.push(r.url())});
 pg.on('pageerror',e=>console.log('PAGEERR',e.message));
 await pg.goto('file:///tmp/surea11y-audit/r12/cms/h/page.html');
 for (const f of ['engine.js','panel.js','review.en.js'].concat(locale!=='en'?[`engine.i18n.${locale}.js`,`panel.i18n.${locale}.js`,`review.${locale}.js`]:[])) await pg.addScriptTag({path:B+f});
 const out=await pg.evaluate(async({locale})=>{
   const P=window.SureA11yPanel;
   const r=P.scanPage(document,{contentSelector:'.entry-content',packs:['@surea11y/pack-cms@0.2.0'],locale,messages:P.messagesFor(locale)});
   const f=r.findings;
   P.defineResultsElement && P.defineResultsElement();
   const el=document.createElement('surea11y-results'); el.id='panelx';
   document.body.append(el);
   el.locale=locale; el.questionFor=P.createQuestionLoader(document,{urls:[],locale}); el.canReview=true; el.canMark=true; el.canShow=true;
   el.findings=f;
   await new Promise(s=>setTimeout(s,300));
   // open all "Check it" / details buttons
   const root=el.shadowRoot;
   for (const b of root.querySelectorAll('button,summary')) { if(/check it|how to check|comprobar|vérifier|prüfen|確認/i.test(b.textContent)) b.click(); }
   for (const d of root.querySelectorAll('details')) d.open=true;
   await new Promise(s=>setTimeout(s,500));
   const list=f.map(x=>({rule:x.ruleId,code:x.reasonCode,group:x.group,out:x.outside,summary:x.summary,hint:x.hint.slice(0,140)}));
   // a11y of panel
   const ar=window.a11ycore.runa11yCoreInPage(location.href,'#panelx',{wcagVersion:'2.2',output:{detail:'findings'}});
   const probs=ar.checksResults.filter(c=>c.outcome==='fail'||c.outcome==='cantTell').map(c=>({rule:c.ruleId,outcome:c.outcome,occ:(c.occurrences||[]).filter(o=>(o.occurrenceOutcome||c.outcome)!=='pass').slice(0,3).map(o=>(o.selector||'')+' :: '+(o.summary||'').slice(0,160)+' :: '+(o.html||'').slice(0,(c.ruleId==='img-alt-decorative'?900:120)))}));
   return {list,probs,text:root.textContent.replace(/\s+/g,' ').slice(0,3000)};
 },{locale});
 console.log(JSON.stringify(out,null,1));
 console.log('NETWORK',reqs);
 await br.close();
})();
