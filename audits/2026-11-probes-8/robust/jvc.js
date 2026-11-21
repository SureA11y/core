const fs=require('fs');const by={};
for(const f of process.argv.slice(2)) for(const line of fs.readFileSync(f,'utf8').trim().split('\n')){const x=JSON.parse(line);if(!x.jsdomVsChrome)continue;for(const [r,d] of Object.entries(x.jsdomVsChrome)){(by[r]=by[r]||[]).push(x.name+': '+d)}}
const only=process.env.RULE;
for(const [r,v] of Object.entries(by).sort((a,b)=>b[1].length-a[1].length)){ if(only&&r!==only)continue; console.log(v.length,r); if(only||process.env.V) v.slice(0,+process.env.V||40).forEach(s=>console.log('   ',s.slice(0,600)));}
