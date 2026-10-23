const {scan,close}=require('../../visual/h.js');
const {JSDOM}=require('/home/user/core/node_modules/jsdom');
function jrun(html,rules){const full=`<!doctype html><html lang="en"><head><title>Probe page</title></head><body>${html}</body></html>`;const dom=new JSDOM(full,{url:'https://example.com/',pretendToBeVisual:true,runScripts:'dangerously'});global.window=dom.window;global.document=dom.window.document;delete require.cache[require.resolve('/home/user/core/src')];const core=require('/home/user/core/src');return core.runDomRulesInPage('https://example.com/',null,{},rules);}
const fmt=(arr)=>arr.map(r=>r.id+'='+r.outcome+(r.occ.length&&r.outcome!=='pass'?'['+r.occ.map(o=>(o.out||'')+' '+o.sel+' '+o.msg.slice(0,70)).join('; ')+']':'')).join(' | ');
const S=(js)=>`<script>${js}</script>`;
const cases=[
 ['L1 self labelledby', `<a id="r1" href="/p" aria-labelledby="r1 t1">Read more</a><h3 id="t1">Pricing</h3>`, ['label-in-name']],
 ['L2 a role=none', `<a href="/" role="none">Home</a>`, ['link-name-present']],
 ['L3 button role=presentation', `<button role="presentation">Save</button>`, ['button-name-present']],
 ['L4 dup id label', `<label for="dup">Name</label><input id="dup"><input id="dup">`, ['form-control-programmatic-label-present']],
 ['L5 TRUE/False', `<div aria-hidden="TRUE">x</div><button aria-expanded="False">b</button>`, ['aria-valid-attr-value']],
 ['L6 Download (PDF, 2 MB)', `<a href="/f.pdf" aria-label="Download (PDF, 2 MB)">Download PDF</a>`, ['label-in-name']],
 ['L7 slotted li', `<x-list><li>One</li><li>Two</li></x-list>`+S(`customElements.define('x-list',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<ul><slot></slot></ul>'}})`), ['listitem-parent-valid','list-children-valid'], 1],
 ['L8 nested across shadow', `<x-btn><a href="/x">inner link</a></x-btn>`+S(`customElements.define('x-btn',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button><slot></slot></button>'}})`), ['nested-interactive-controls-absent'], 1],
 ['L9 shadow->light IDREF', `<span id="lbl">Light label</span><x-in></x-in>`+S(`customElements.define('x-in',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<input aria-labelledby="lbl">'}})`), ['aria-valid-attr-value','form-control-programmatic-label-present'], 1],
 ['L10a lang=qaa', `<p lang="qaa">x</p>`, ['valid-lang']],
 ['L10b lang=en-', `<p lang="en-">x</p>`, ['valid-lang']],
 ['L11 video poster figcaption', `<figure><video poster="p.png" src="v.mp4"></video><figcaption>A cat on a mat</figcaption></figure>`, ['video-poster-text-alternative-present']],
 ['L12 icon img in named link', `<a href="/">Home <img src="i.png" alt=""></a>`, ['img-alt-decorative']],
];
(async()=>{
 for (const [l,h,rules,shadowOnlyC] of cases){
  const c=await scan(h,rules);
  let j='(skipped)'; try{ const r=await jrun(h,rules); j=r.checksResults.filter(x=>rules.includes(x.ruleId)).map(x=>x.ruleId+'='+x.outcome).join(' | ');}catch(e){j='ERR '+e.message}
  console.log('==',l,'\n   C:',fmt(c),'\n   J:',j);
 }
 await close();
})();
