const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [rule,html]=[process.argv[2],process.argv[3]];
function run(ids){const dom=createDom(html);const r=runa11yCoreOnDom(dom,{entryPointParity:false,runOnly:ids?{includeRuleIds:ids}:null});const cr=r.checksResults.find(x=>x.ruleId===rule);const all=r.checksResults.map(c=>c.ruleId);dom.window.close();return [cr.outcome,all];}
const [alone]=run([rule]);const [full,all]=run(null);console.log('alone',alone,'full',full);
const idx=all.indexOf(rule);
for(const x of all.slice(0,idx)){const [o]=run([x,rule]);if(o!==alone)console.log('polluter:',x,o);}
