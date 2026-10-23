const path='/home/user/core';
const { JSDOM } = require(path+'/node_modules/jsdom');
const core = require(path+'/src/index.js');
const warns=[];
const origWarn=console.warn; console.warn=(...a)=>{warns.push(a.join(' '));};
const SAMPLE = `<!doctype html><html lang="en"><head><title>T</title></head><body>
<header><nav aria-label="Main"><a href="/a">Home</a><a href="#main">Skip to content</a></nav></header>
<main id="main"><h1>Hello</h1>
<div id="a" class="card"><img src="x.png"><button></button><p style="color:#999;background:#fff">low contrast</p></div>
<div id="b" class="card"><input type="text"><a href="/x"></a><span id="dup">1</span><span id="dup">2</span></div>
<div id="empty"></div>
<div id="host"></div>
<div hidden><img src="h.png"></div>
<section aria-label="s"><h3>Skip</h3><table><tr><th></th></tr></table></section>
</main><footer>f</footer></body></html>`;
function dom(html=SAMPLE, setup){
  const d=new JSDOM(html,{url:'https://example.test/',pretendToBeVisual:true});
  global.window=d.window; global.document=d.window.document;
  if(setup) setup(d.window.document);
  return d;
}
function run(opts={}){
  const {html, ctx=null, eo={}, ro=null, setup, fn='runDomRulesInPage'}=opts;
  warns.length=0;
  const d=dom(html,setup);
  try { const r=core[fn]('https://example.test/',ctx,eo,ro); return {r, warns:warns.slice()}; }
  catch(e){ return {err:e, warns:warns.slice()}; }
  finally { try{d.window.close()}catch{} }
}
function summ(r){ if(!r) return null; const cr=r.checksResults||[]; const o={}; for(const c of cr){o[c.outcome]=(o[c.outcome]||0)+1} return {n:cr.length,o,ids:cr.map(c=>c.ruleId)}; }
module.exports={core,run,summ,dom,SAMPLE,warns,origWarn};
