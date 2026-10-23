// compare profile vs plain vs alone for a rule on given html
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [rule,html]=[process.argv[2],process.argv[3]];
function run(profile,alone){const dom=createDom(html);const eo=profile?{perfStats:true,profileRules:true}:{};
 const r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false,runOnly:alone?{includeRuleIds:[rule]}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();
 return cr.outcome+'|'+cr.occurrences.map(o=>o.selector).join(',');}
console.log('full+profile',run(true,false));console.log('full        ',run(false,false));console.log('alone+prof  ',run(true,true));console.log('alone       ',run(false,true));
