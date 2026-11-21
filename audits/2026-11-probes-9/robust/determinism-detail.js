'use strict';
// Occurrence-level determinism: 3 scans in one tab + 1 in a fresh tab, combined fixtures page.
const fs=require('fs');const { serve, launch, addBundle } = require('./lib');
const html=fs.readFileSync(__dirname+'/'+(process.argv[2]||'combined.html'),'utf8');
const strip=(o)=>JSON.stringify(o,(k,v)=>/^(timestamp|durationMs|time|ms|elapsed|startedAt|finishedAt|generatedAt|warmUpMs|date)$/i.test(k)?undefined:v);
(async()=>{const s=await serve({'/c':{body:html}});const {browser,context}=await launch();
const scan=async(page)=>page.evaluate(()=>{const r=window.a11ycore.runa11yCoreInPage(null,null,{},null);return r.checksResults.map(c=>({id:c.ruleId,o:c.outcome,occ:(c.occurrences||[]).map(x=>{const {html,...rest}=x;return rest})}))});
const p1=await context.newPage();await p1.goto(s.base+'/c');await addBundle(p1,s.base);
const runs=[];for(let i=0;i<3;i++)runs.push(await scan(p1));
const p2=await context.newPage();await p2.goto(s.base+'/c');await addBundle(p2,s.base);runs.push(await scan(p2));
const ref=runs[0];
for(let i=1;i<runs.length;i++){const a=ref,b=runs[i];let n=0;for(let j=0;j<a.length;j++){const x=strip(a[j]),y=strip(b[j]);if(x!==y){n++;if(n<=6){let k=0;while(k<x.length&&x[k]===y[k])k++;console.log(`run ${i} ${a[j].id}: ...${x.slice(Math.max(0,k-200),k+150)}\n   vs ...${y.slice(Math.max(0,k-200),k+150)}`)}}}console.log('run',i,'rules differing',n);}
await browser.close();s.close();})();
