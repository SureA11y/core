const {launch,serve,scanPage}=require('./lib.cjs'); const P='./proj/node_modules/@surea11y/core/';
const {buildBaselineEntries,matchBaseline}=require(P+'src/baseline.js'); const {renderSarifReport}=require(P+'src/sarif.js');
const base0=`<img src="a.png" class="x y"><input type="text" id="q"><button></button><a href="/x"></a>`;
const variants={
 same:base0,
 unrelatedAdd:`<p>New intro paragraph</p><div><span>wrap</span></div>`+base0,
 attrOrder:`<img class="x y" src="a.png"><input id="q" type="text"><button></button><a href="/x"></a>`,
 classOrder:`<img src="a.png" class="y x"><input type="text" id="q"><button></button><a href="/x"></a>`,
 textChangeElsewhere:base0+`<p>footer changed ${Date.now()}</p>`,
 childOfFlagged:`<img src="a.png" class="x y"><input type="text" id="q"><button></button><a href="/x"></a>`,
};
const wrap=b=>`<!doctype html><html><head></head><body>${b}</body></html>`;
(async()=>{ const routes={}; for(const k in variants) routes['/'+k]={body:wrap(variants[k])};
 const {server,base}=await serve(routes); const b=await launch(); const page=await b.newPage();
 const custom=[{id:'custom-no-span',meta:{title:'No spans',description:'d',severity:'minor',type:'automatic',normativeMappings:[]},runInPage:`function(ctx){ var els=[...document.querySelectorAll('img')]; return {outcome: els.length?'fail':'pass', occurrences: els.map(function(e){return {element:e, summary:'img found', hint:'h'};})}; }`}];
 const res={}; for(const k in variants){ await page.goto(base+'/'+k); res[k]=await scanPage(page,base+'/'+k,null,{customRules:custom}); }
 const entries=buildBaselineEntries(res.same); console.log('entries',entries.length, entries.map(e=>e.ruleId+'|'+e.reasonCode+'|'+e.html.length).join('  '));
 console.log('custom rule result', JSON.stringify(res.same.checksResults.find(c=>c.ruleId==='custom-no-span')).slice(0,600));
 for(const k in variants){ const m=matchBaseline(res[k],entries); console.log(k.padEnd(20),'total',m.totalFail,'known',m.knownCount,'new',m.newCount,'stale',m.staleCount, m.newOccurrences.map(o=>o.ruleId).join(',')); }
 // cantTell: never baselined
 const ct=res.same.checksResults.filter(c=>c.occurrences.some(o=>(o.occurrenceOutcome||c.outcome)==='cantTell')).map(c=>c.ruleId); console.log('cantTell rules (never baselined):',ct.join(','));
 // SARIF with baseline
 const s=JSON.parse(renderSarifReport(res.unrelatedAdd,{baselineEntries:entries})); console.log('sarif w/ baseline results', s.runs[0].results.filter(r=>r.level==='error').map(r=>r.ruleId).join(','));
 await b.close(); server.close(); })();
