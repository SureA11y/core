const fs=require('fs');const dir=process.argv[2];
const recs=[];for(const f of fs.readdirSync(dir).filter(f=>/^(gen|mutate)-\d+\.jsonl$/.test(f)))for(const l of fs.readFileSync(dir+'/'+f,'utf8').trim().split('\n').filter(Boolean))recs.push(JSON.parse(l));
const by={};let ms=[];
for(const r of recs){ms.push(r.ms);for(const i of r.issues){const k=i.kind+' '+(i.ruleId||'')+(i.kind==='nondeterministic'?i.rules.join(','):'')+(i.kind==='badText'?' '+i.match:'');(by[k]=by[k]||[]).push({seed:r.seed,mode:r.mode,i});}}
console.log('cases',recs.length);ms.sort((a,b)=>a-b);console.log('ms p50',ms[ms.length>>1],'p99',ms[Math.floor(ms.length*.99)],'max',ms[ms.length-1]);
for(const [k,v] of Object.entries(by).sort((a,b)=>b[1].length-a[1].length)) console.log(v.length, k, 'seeds', v.slice(0,6).map(x=>x.seed).join(','), JSON.stringify(v[0].i).slice(0,300));
const slow=recs.filter(r=>r.ms>8000).map(r=>r.seed+':'+r.ms+':'+JSON.stringify(r.top));console.log('slow',slow.length,slow.slice(0,15).join('\n'));
