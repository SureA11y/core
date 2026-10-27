const {gen,attachShadows}=require('./gen.js');const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [seed,rule]=[+process.argv[2],process.argv[3]];const g=gen(seed);
function run(light,shadows,profile){const dom=createDom(light);attachShadows(dom.window.document,shadows);const eo=profile?{perfStats:true,profileRules:true}:{};
 const r=runa11yCoreOnDom(dom,{engineOptions:eo,entryPointParity:false});const c=r.checksResults.find(x=>x.ruleId===rule);dom.window.close();return c.outcome+'|'+c.occurrences.map(o=>o.selector).join(',');}
let light=g.html, shadows=g.shadows.map(s=>({...s}));
const pred=(l,sh)=>run(l,sh,true)!==run(l,sh,false);
console.log('src',pred(light,shadows));
light=minimize(light,l=>pred(l,shadows));
for(const s of shadows){const wrap=h=>'<!doctype html><html><head></head><body>'+h+'</body></html>';
 const m=minimize(wrap(s.html),h=>{const body=h.replace(/^.*<body>/s,'').replace(/<\/body>.*$/s,'');const sh2=shadows.map(x=>x===s?{...x,html:body}:x);return pred(light,sh2)});s.html=m.replace(/^.*<body>/s,'').replace(/<\/body>.*$/s,'');}
console.log('LIGHT',light);console.log('SHADOWS',JSON.stringify(shadows.map(s=>[s.sid,s.mode,s.delegatesFocus,s.html])));
console.log(run(light,shadows,true),'/',run(light,shadows,false));
