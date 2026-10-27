// remove idref tokens one at a time while full!==alone persists
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const rule=process.argv[2];let html=process.argv[3];
function run(h,alone){const dom=createDom(h);const r=runa11yCoreOnDom(dom,{entryPointParity:false,runOnly:alone?{includeRuleIds:[rule]}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();return cr.outcome+'|'+cr.occurrences.map(o=>o.selector).join(',');}
const pred=h=>run(h,true)!==run(h,false);
let changed=true;while(changed){changed=false;const re=/aria-labelledby="([^"]*)"/g;let m;const ms=[];while((m=re.exec(html)))ms.push([m.index,m[0],m[1]]);
 outer: for(const [idx,full,val] of ms){const toks=val.split(/\s+/);for(let i=0;i<toks.length;i++){const nt=toks.filter((_,j)=>j!==i).join(' ');const cand=html.slice(0,idx)+(nt?`aria-labelledby="${nt}"`:'')+html.slice(idx+full.length);if(pred(cand)){html=cand;changed=true;break outer;}}}}
console.log(html);console.log(run(html,true),'/',run(html,false));
