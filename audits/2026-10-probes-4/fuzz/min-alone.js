const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [rule,html]=[process.argv[2],process.argv[3]];
function run(h,alone){const dom=createDom(h);const r=runa11yCoreOnDom(dom,{entryPointParity:false,runOnly:alone?{includeRuleIds:[rule]}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();return cr.outcome+'|'+cr.occurrences.map(o=>o.selector).join(',');}
const pred=h=>run(h,true)!==run(h,false);
const out=minimize(html,pred);console.log(out);console.log('alone',run(out,true));console.log('full ',run(out,false));
