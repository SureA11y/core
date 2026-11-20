const fs=require('fs'); const dir=process.argv[2]; const f=fs.readdirSync(dir).filter(x=>x.endsWith('.cpuprofile')).map(x=>dir+'/'+x).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs)[0];
const p=JSON.parse(fs.readFileSync(f)); const self=new Map(); const byId=new Map(p.nodes.map(n=>[n.id,n]));
const dt={}; for(let i=0;i<p.samples.length;i++){dt[p.samples[i]]=(dt[p.samples[i]]||0)+(p.timeDeltas[i]||0);}
// inclusive time per function name
const parent=new Map(); for(const n of p.nodes) for(const c of (n.children||[])) parent.set(c,n.id);
const incl=new Map(); for(const [id,t] of Object.entries(dt)){ let cur=Number(id); const seen=new Set(); while(cur!=null){const n=byId.get(cur); const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-1)[0]+':'+n.callFrame.lineNumber; if(!seen.has(k)){incl.set(k,(incl.get(k)||0)+t);seen.add(k);} cur=parent.get(cur);} 
 const n=byId.get(Number(id)); const k=n.callFrame.functionName+' '+n.callFrame.url.split('/').slice(-1)[0]+':'+n.callFrame.lineNumber; self.set(k,(self.get(k)||0)+t);}
console.log('--incl'); [...incl].sort((a,b)=>b[1]-a[1]).slice(0,45).forEach(([k,t])=>console.log((t/1000|0)+'ms',k));
console.log('--self'); [...self].sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([k,t])=>console.log((t/1000|0)+'ms',k));
