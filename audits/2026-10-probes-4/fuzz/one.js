const {gen}=require('./gen.js');const {scan}=require('./check.js');console.warn=()=>{};
const c=gen(+process.argv[2]);c.engineOptions={};const a=scan(c,{profile:true});
console.log(Math.round(a.ms),'warm',a.result.perfStats.warmUpMs.toFixed(0),Object.entries(a.result.perfStats.ruleTimings).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([k,v])=>k+'='+v.toFixed(0)).join(' '));
