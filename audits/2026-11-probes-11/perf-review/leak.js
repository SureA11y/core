const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');const tree=process.argv[2];const core=require(tree+'/src/core.js');
const {pages}=require('../perf/pages');const html=pages.spa();
const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true,runScripts:'dangerously'});global.window=d.window;global.document=d.window.document;
const mem=()=>{global.gc();global.gc();return process.memoryUsage().heapUsed/1e6;};
const rules=['css-focus-indicator-suppressed','form-control-label-quality','target-size-minimum','label-in-name','contrast-minimum','img-alt-present','button-name-present'];
let m0;for(let i=0;i<41;i++){core.runDomRulesInPage('https://example.test/',null,{includeShadowDom:true,excludeSelectors:['.x'+i],rules:{include:rules,'button-name-present':{excludeSelectors:['.y'+i]}}},null);if(i===5)m0=mem();}
console.log(tree,'heap MB after scan 6:',m0.toFixed(1),'after scan 41:',mem().toFixed(1),'shared keys:',Object.keys(d.window.__a11ycoreSharedCache||{}).length);
