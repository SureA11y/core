const fs=require('fs');for(const f of process.argv.slice(2)){const l=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);const c={};let n=0,done=null;
for(const x of l){if(x.done){done=x;continue}n++;for(const p of x.problems||[]){if(/placeholder in/.test(p))continue;const k=p.replace(/\d+/g,'N').slice(0,160);(c[k]=c[k]||[]).push(x.i)}}
console.log('==',f,'pages',n,done?'scans '+done.scans:'(running)');for(const[k,v] of Object.entries(c).sort((a,b)=>b[1].length-a[1].length))console.log(' ',v.length,k,'  e.g.',v.slice(0,4).join(','))}
