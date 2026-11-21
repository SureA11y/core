const C=require('./chrome-lib.js');
(async()=>{
 const b=await C.launch(); const p=await b.newPage();
 await p.setContent('<html lang="en"><title>x</title><body><main><button></button><img src=x></main></body></html>');
 await C.inject(p,['de']);
 let t=Date.now(); const r=await C.scan(p,{locale:'de',perfStats:true,profileRules:true});
 console.log(Date.now()-t, r.engine.locale, Object.keys(r.perfStats), JSON.stringify(r.perfStats.ruleTimings||r.ruleTimings).slice(0,300));
 console.log(r.checksResults.filter(c=>c.outcome==='fail').map(c=>c.ruleId+':'+c.occurrences[0].summary));
 await b.close();
})();
