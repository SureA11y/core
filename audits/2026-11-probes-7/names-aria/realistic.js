const { launch, BUNDLE } = require('./harness'); const fs=require('fs');
(async()=>{ const b=await launch(); const p=await b.newPage(); await p.setContent(fs.readFileSync(process.argv[2]||'realistic.html','utf8')); await p.addScriptTag({content:BUNDLE});
 const r=await p.evaluate(async()=>{ const res=await window.a11ycore.runa11yCoreInPage(null,null,{},null); return res.checksResults.filter(c=>c.outcome==='fail'||c.outcome==='cantTell').map(c=>({id:c.ruleId,o:c.outcome,occ:(c.occurrences||[]).map(o=>`[${o.occurrenceOutcome||c.outcome}] ${o.selector} :: ${o.summary}`)})); });
 for (const c of r) { console.log(c.id, c.o); for (const o of c.occ) console.log('   '+o.slice(0,260)); } await b.close(); })();
