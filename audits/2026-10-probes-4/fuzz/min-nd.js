const {gen}=require('./gen.js');const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [seed,rule,useRunOnly]=[+process.argv[2],process.argv[3],process.argv[4]==='1'];
function run(html,profile){const dom=createDom(html);const eo=profile?{perfStats:true,profileRules:true}:{};
 const r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false,runOnly:useRunOnly?{includeRuleIds:[rule]}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();
 return cr.outcome+'|'+cr.occurrences.map(o=>o.selector).join(',');}
const pred=(h)=>run(h,true)!==run(h,false);
const src=gen(seed).html;console.log('pred on src',pred(src));
const out=minimize(src,pred);console.log(out);console.log('profile:',run(out,true));console.log('plain  :',run(out,false));
