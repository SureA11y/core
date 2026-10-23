const {gen}=require('./gen.js');const {scan,stripVolatile}=require('./check.js');console.warn=()=>{};
const seed=+process.argv[2];const c=gen(seed);c.engineOptions=JSON.parse(process.argv[3]||'{"locale":"fr"}');
const prof=[true,false,false,true];const rs=prof.map(p=>{const a=scan(c,{profile:p});return stripVolatile(a.result)});
for(let k=1;k<rs.length;k++){const d=[];for(let i=0;i<rs[0].checksResults.length;i++){if(JSON.stringify(rs[0].checksResults[i])!==JSON.stringify(rs[k].checksResults[i]))d.push(rs[0].checksResults[i].ruleId)}console.log('run0 vs run'+k,'(profile',prof[k]+')',d.length,d.slice(0,5));}
const d0=rs[0].checksResults.find(x=>x.ruleId==='img-alt-present'), d1=rs[1].checksResults.find(x=>x.ruleId==='img-alt-present');
console.log(JSON.stringify(d0.occurrences.map(o=>o.selector)).slice(0,500));console.log(JSON.stringify(d1.occurrences.map(o=>o.selector)).slice(0,500));
console.log('shadows',c.shadows.length);
