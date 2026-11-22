const root=process.argv[2];const kind=process.argv[3];
const T=require({main:'/home/user/core',br:'/home/user/r12-contrast'}[root]+'/src/testing.js');console.warn=()=>{};
let body='';
if(kind==='cat') for(let i=0;i<3000;i++) body+=`<li><span class="woocommerce-Price-amount"><bdi><span class="sym">€</span>${i},00</bdi></span></li>`;
else { body='<p>'; for(let i=0;i<300;i++){ body+='<span>$</span>'+'<span><b></b></span>'.repeat(200); } body+='</p>'; }
const html=`<!doctype html><html lang=en><head><title>t</title></head><body><main><ul>${body}</ul></main></body></html>`;
(async()=>{for(const ids of [['contrast-minimum'],['symbol-graphic-contrast']]){const c=process.cpuUsage();const r=await T.runa11yCoreOnHtml(html,{runOnly:ids,entryPointParity:false});const d=process.cpuUsage(c);console.log(root,kind,ids[0],Math.round((d.user+d.system)/1000),'ms',r.checksResults[0].outcome);}})();
