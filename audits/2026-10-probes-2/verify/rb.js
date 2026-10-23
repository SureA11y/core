const { chromium } = require('/home/user/core/node_modules/playwright');
const fs=require('fs'); const OURS=fs.readFileSync('/home/user/core/surea11y.browser.js','utf8');
const wrap=h=>`<!doctype html><html lang="en"><head><title>P</title></head><body>${h}</body></html>`;
(async()=>{
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
async function scan(label, html, rules, opts={}){
  const p=await b.newPage(); await p.setContent(opts.raw?html:wrap(html)); if(opts.setup) await p.evaluate(opts.setup);
  await p.addScriptTag({content:OURS});
  const t=Date.now();
  const r=await Promise.race([p.evaluate(({rules,n})=>{const out=[];for(let i=0;i<n;i++){const o=a11ycore.runa11yCoreInPage(location.href,null,{},rules);out.push(o.checksResults.filter(x=>!rules||rules.includes(x.ruleId)).map(x=>x.ruleId+'='+x.outcome+(x.error?'['+x.error.slice(0,40)+']':'')).join(', '));}return out;},{rules,n:opts.n||1}), new Promise(r=>setTimeout(()=>r('TIMEOUT 20s'),20000))]);
  const res=Array.isArray(r)?(opts.n?Object.entries(r.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})).map(([k,v])=>v+'x '+k).join(' || '):r[0]):r;
  console.log(label.padEnd(10), (Date.now()-t)+'ms', res.slice(0,300));
  if(r==='TIMEOUT 20s'){ await p.context().close().catch(()=>{});} else await p.close();
}
await scan('R1 hang','<main><h1>F</h1><form><input name="parentNode"><label>Ok<input></label></form></main>',['form-control-label-quality']);
await scan('R1b ctl','<main><h1>F</h1><form><input name="zparentNode"><label>Ok<input></label></form></main>',['form-control-label-quality']);
await scan('R2a doc','<main><img name="documentElement" alt="Logo"><button></button><img src="x.png"></main>',['button-name-present','img-alt-present']);
await scan('R2b title','<main><form name="title"></form></main>',['page-title-present']);
await scan('R2c gA','<main><form><input name="getAttribute"><button></button></form></main>',['button-name-present']);
await scan('R5 marq','<main><h1>News</h1><marquee>old</marquee></main>',['text-spacing-content-loss'],{n:30});
await scan('R6 sr','<x-bad><button></button></x-bad><img src=q>',['button-name-present','img-alt-present'],{setup:()=>customElements.define('x-bad',class extends HTMLElement{get shadowRoot(){throw new Error('sr')}})});
await scan('R8 svg','<svg xmlns="http://www.w3.org/2000/svg"><title>S</title><rect width="10" height="10"/></svg>',['page-title-present'],{raw:true});
await b.close();
})();
