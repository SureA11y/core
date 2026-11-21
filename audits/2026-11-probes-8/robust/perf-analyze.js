// exponent per rule between smallest and largest size, for rules with >= MIN ms at largest
const fs=require('fs');const rows=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').map(JSON.parse);
const MIN=+(process.env.MIN||50);
const by={};for(const r of rows)(by[r.env+':'+r.kind]=by[r.env+':'+r.kind]||[]).push(r);
for(const [k,rs] of Object.entries(by)){rs.sort((a,b)=>a.elements-b.elements);
 const a=rs.length>2?rs[rs.length-3]:rs[0],b=rs[rs.length-1];
 const ex=(x,y)=>Math.log(y/x)/Math.log(b.elements/a.elements);
 console.log(`${k}: elements ${rs.map(r=>r.elements).join(',')} total ms ${rs.map(r=>r.total).join(',')} warm ${rs.map(r=>r.warm).join(',')} totalExp ${ex(a.total,b.total).toFixed(2)}`);
 const ids=Object.keys(b.timings).filter(id=>b.timings[id]>=MIN).sort((x,y)=>b.timings[y]-b.timings[x]);
 for(const id of ids.slice(0,+(process.env.TOP||8))){const e=ex(Math.max(a.timings[id],0.5),b.timings[id]);console.log(`   ${id.padEnd(40)} ${rs.map(r=>r.timings[id]).join(', ')}  exp ${e.toFixed(2)}${e>1.4?'  <<<':''}`);}
}
