const {JSDOM}=require('/home/user/core/node_modules/jsdom');
const dom=new JSDOM('<!doctype html><html lang=en><title>t</title><main><h1>x</h1></main>');
global.window=dom.window;global.document=dom.window.document;
const core=require('/home/user/core/src/index.js');
const w=[];const ow=console.warn;console.warn=(...a)=>w.push(a.join(' '));
for(const eo of [{output:{detail:'finding'}},{contrast:{mode:'auditor'}},{locale:5},{excludeSelectors:5}]){
  w.length=0; let r; try{r=core.runDomRulesInPage(null,null,eo)}catch(e){ow('THREW',e.message);continue}
  ow(JSON.stringify(eo),'warnings:',w.length, w.slice(0,2));
}
