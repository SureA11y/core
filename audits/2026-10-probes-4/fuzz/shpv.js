const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [rule,light,shadow]=process.argv.slice(2);
function run(profile,alone){const dom=createDom('<!doctype html><html lang=en><head><title>t</title></head><body><main>'+light+'</main></body></html>');const h=dom.window.document.querySelector('x-card');h.attachShadow({mode:'open'}).innerHTML=shadow;
const eo=profile?{perfStats:true,profileRules:true}:{};const r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false,runOnly:alone?{includeRuleIds:[rule]}:null});const c=r.checksResults.find(x=>x.ruleId===rule);return c.outcome+'|'+c.occurrences.map(o=>o.selector+':'+(o.i18n&&o.i18n.summaryKey)).join(',');}
console.log('full+prof',run(true,false));console.log('full     ',run(false,false));console.log('alone+prf',run(true,true));console.log('alone    ',run(false,true));
