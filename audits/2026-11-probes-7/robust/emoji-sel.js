// Selector anchored on an attribute value with astral characters: does it resolve (jsdom and Chromium)?
const L=require('./lib.js');const C=require('./chrome-lib.js');console.warn=()=>{};
const V=process.argv[2]||'😀👍🏽';
const HTML=`<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main><div data-testid="${V}"><span><button></button></span></div></main></body></html>`;
(async()=>{
const {r,dom}=L.scanJsdom(HTML);const o=r.checksResults.find(c=>c.ruleId==='button-name-present').occurrences[0];
let j;try{j=!!dom.window.document.querySelector(o.selector)}catch(e){j='ERR '+e.message}
const b=await C.launch();const p=await b.newPage();await p.setContent(HTML);await C.inject(p);
const rc=await C.scan(p,{},{includeRuleIds:['button-name-present']});const oc=rc.checksResults[0].occurrences[0];
const cm=await p.evaluate((s)=>{try{return !!document.querySelector(s)}catch(e){return 'ERR '+e.message}},oc.selector);
const jsdomNative=dom.window.document.querySelector('[data-testid="'+V+'"]');
console.log(JSON.stringify({value:V,jsdomSelector:o.selector,resolvesInJsdom:j,plainAttrSelectorInJsdom:!!jsdomNative,chromeSelector:oc.selector,resolvesInChrome:cm}));await b.close();})();
