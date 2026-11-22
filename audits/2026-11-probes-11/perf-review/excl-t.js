const {JSDOM}=require('/home/user/core-r11/node_modules/jsdom');const tree=process.argv[2];const core=require(tree+'/src/core.js');
const {pages}=require('../perf/pages');const html=pages[process.argv[3]||'blog']();
const ex=JSON.parse(process.argv[4]||'[]');const t=[];
for(let i=0;i<3;i++){const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});global.window=d.window;global.document=d.window.document;
const s=performance.now();core.runDomRulesInPage('https://example.test/',null,{includeShadowDom:true,excludeSelectors:ex},null);t.push(performance.now()-s);d.window.close();}
console.log(tree.split('/').pop(),process.argv[3],JSON.stringify(ex),'median',t.sort((a,b)=>a-b)[1].toFixed(0));
