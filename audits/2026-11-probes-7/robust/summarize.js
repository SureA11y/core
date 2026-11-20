const fs=require('fs');
for (const f of process.argv.slice(2)) {
 const l=fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
 const counts={};
 for(const x of l){ if(!x.problems) continue; for(const p of x.problems){ if(/placeholder in/.test(p)){const toks=(p.match(/\{\{[^}]*\}\}/g)||[]);if(toks.every(t=>/^\{\{(x|name|label)\}\}$/.test(t)))continue;} if(/suspicious text/.test(p)&&/undefined|NaN/.test(p)&&!/object Object/.test(p))continue; const k=p.replace(/"[^"]*"/g,'"…"').replace(/\[\d+\].*$/,'').replace(/at line \d+.*/,'').slice(0,140); (counts[k]=counts[k]||[]).push(x.name);} }
 console.log('==',f,l.length, 'pages; median ms', (()=>{const a=l.filter(x=>x.ms).map(x=>x.ms).sort((a,b)=>a-b);return a[a.length>>1]})());
 for (const [k,v] of Object.entries(counts).sort((a,b)=>b[1].length-a[1].length)) console.log(v.length, k, '|', [...new Set(v)].slice(0,3).join(','));
}
