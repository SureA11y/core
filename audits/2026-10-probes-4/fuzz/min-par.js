const {gen,attachShadows}=require('./gen.js');const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');const core=require('/home/user/core/src/index.js');console.warn=()=>{};
const [seed,rule]=[+process.argv[2],process.argv[3]];const eo=JSON.parse(process.argv[4]||'{}');
const g=gen(seed);
function both(html){const out=[];for(const which of ['inpage','node']){const dom=createDom(html);if(process.argv[5])attachShadows(dom.window.document,g.shadows);global.window=dom.window;global.document=dom.window.document;dom.window.__a11ycoreEngineOptions=eo;
 const r=(which==='inpage'?core.runa11yCoreInPage:core.runDomRulesInPage)('https://example.test/',null,eo,process.env.FULL?null:{includeRuleIds:[rule]});const cr=r.checksResults.find(x=>x.ruleId===rule);out.push(cr.outcome+'|'+cr.occurrences.length+'|'+(cr.error||''));dom.window.close();}return out;}
const pred=h=>{const [a,b]=both(h);return a!==b};
console.log('src',both(g.html));
if(pred(g.html)){const m=minimize(g.html,pred);console.log(m);console.log(both(m));}
