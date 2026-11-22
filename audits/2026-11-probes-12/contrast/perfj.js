const fs=require('fs');const html=fs.readFileSync('/tmp/surea11y-audit/r11/perf/page-shop.html','utf8');
const root=process.argv[2];const ids=['contrast-computable'];
const T=require({r8:'/home/user/core-r8',main:'/home/user/core',br:'/home/user/r12-contrast'}[root]+'/src/testing.js');
console.warn=()=>{};
(async()=>{const out=[];for(let i=0;i<4;i++){const c=process.cpuUsage();await T.runa11yCoreOnHtml(html,{runOnly:ids,entryPointParity:false});const d=process.cpuUsage(c);out.push(Math.round((d.user+d.system)/1000));}
out.sort((a,b)=>a-b);console.log(root,'cpu ms sorted',out.join(' '));})();
