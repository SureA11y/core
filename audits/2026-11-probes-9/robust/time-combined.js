const fs=require('fs');const { serve, launch, addBundle, scanSummary, diff } = require('./lib');
(async()=>{const { base, close } = await serve({'/c':{body:fs.readFileSync(__dirname+'/combined.html')}});
const {browser,context}=await launch();const page=await context.newPage();await page.goto(base+'/c');await addBundle(page,base);
let prev;for(let i=0;i<3;i++){const t=Date.now();const r=await scanSummary(page);console.log('scan',i,Date.now()-t,'ms',r.ok, r.ok?Object.keys(r.out).length:r.msg);
if(prev)console.log('diff',diff(prev.out,r.out));prev=r;}
const errs=Object.entries(prev.out).filter(([k,v])=>v.includes('ERR'));console.log(errs);
await browser.close();close();})();
