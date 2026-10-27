const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const rule=process.argv[2];
for(const html of process.argv.slice(3)){
function run(h,alone){const dom=createDom(h);const r=runa11yCoreOnDom(dom,{entryPointParity:false,runOnly:alone?{includeRuleIds:[rule]}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();return cr.outcome+'|'+cr.occurrences.map(o=>o.selector).join(',');}
const a=run(html,true),f=run(html,false);console.log(a===f?'same ':'DIFF ',a,'/',f,' ',html.slice(0,250));}
