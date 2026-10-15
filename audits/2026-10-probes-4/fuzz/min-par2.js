const {gen}=require('./gen.js');const {minimize}=require('./minimize.js');
const {createDom,runa11yCoreOnDom}=require('/home/user/core/src/testing.js');console.warn=()=>{};
const [seed,rule]=[+process.argv[2],process.argv[3]];
const pred=h=>{const dom=createDom(h);try{runa11yCoreOnDom(dom,{runOnly:{includeRuleIds:[rule]}});return false}catch(e){return /disagree/.test(e.message)}finally{dom.window.close()}};
const src=process.argv[4]||gen(seed).html;console.log('pred',pred(src));const m=minimize(src,pred);console.log(m);
