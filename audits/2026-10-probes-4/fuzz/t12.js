const {gen}=require('./gen.js');const {scan}=require('./check.js');console.warn=()=>{};
const seed=+process.argv[2];const c=gen(seed);c.engineOptions={locale:process.argv[3]||'es'};
for(const profile of [true,false,true,false]){const a=scan(c,{profile});console.log('profile',profile,Math.round(a.ms),'ms', a.error&&String(a.error).slice(0,200));a.dom.window.close();}
