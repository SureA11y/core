// node min-sel.js <seed> <ruleId>  : minimise a selectorWrongElement for a rule
const {gen}=require('./gen.js');const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [seed,rule]=[+process.argv[2],process.argv[3]];
function bad(html){const dom=createDom(html);const doc=dom.window.document;
 const r=runa11yCoreOnDom(dom,{entryPointParity:false,runOnly:{includeRuleIds:[rule]}});
 const cr=r.checksResults.find(x=>x.ruleId===rule);let b=false;
 for(const o of cr.occurrences){if(!o.selector||!o.structuralPath)continue;let t=doc.documentElement;for(const i of o.structuralPath)t=t&&t.children[i];const el=doc.querySelector(o.selector);if(el!==t){b=true;break}}
 dom.window.close();return b;}
const out=minimize(gen(seed).html,bad);console.log(out);
