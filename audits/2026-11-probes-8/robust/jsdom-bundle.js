'use strict';
// Run a browser bundle inside jsdom (runScripts: outside-only), to compare 1.17.0 and main under jsdom.
const fs=require('fs');const {JSDOM}=require('/home/user/core-r8/node_modules/jsdom');
const SRC={base:fs.readFileSync('/tmp/surea11y-audit/r7/robust/base.browser.js','utf8'),head:fs.readFileSync('/home/user/core-r8/surea11y.browser.js','utf8')};
function scanWith(v,html,opts={perfStats:true,profileRules:true},runOnly=null,setup){
  const dom=new JSDOM(html,{url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true});
  if(setup)setup(dom);
  dom.window.eval(SRC[v]);
  const w=dom.window;w.console.warn=()=>{};
  const t=Date.now();const r=w.a11ycore.runa11yCoreInPage(null,null,opts,runOnly);const ms=Date.now()-t;
  return {r,ms,dom};
}
module.exports={scanWith,SRC};
if(require.main===module){const {r,ms}=scanWith(process.argv[2]||'head','<html lang=en><title>t</title><main><img src=x></main>');console.log(ms,r.checksResults.length,r.checksResults.find(c=>c.ruleId==='img-alt-present').outcome);}
