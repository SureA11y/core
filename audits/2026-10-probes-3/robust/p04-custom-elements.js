// Custom elements with hostile getters/methods and pages that mutate the DOM
// while the scan reads it. Compared to the same page without the hostile part.
const h = require('./harness');
const CONTENT = `<button id="b"></button><img id="i" src="q.png"><label>Ok <input id="ok"></label><h1>Head</h1><a href="#x" id="l"></a>`;
const mk = (pre, script) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${pre}${CONTENT}<script>${script}</script></body></html>`;
const V = {
  shadowRootGetterThrows: ['<x-bad><button></button></x-bad>', `customElements.define('x-bad', class extends HTMLElement { get shadowRoot(){ throw new Error('sr') } })`],
  attrsGetterThrows: ['<x-bad></x-bad>', `customElements.define('x-bad', class extends HTMLElement { get attributes(){ throw new Error('attrs') } })`],
  getAttributeThrows: ['<x-bad role="button"></x-bad>', `customElements.define('x-bad', class extends HTMLElement { getAttribute(){ throw new Error('ga') } })`],
  childNodesThrows: ['<x-bad>hi</x-bad>', `customElements.define('x-bad', class extends HTMLElement { get childNodes(){ throw new Error('cn') } get children(){ throw new Error('ch') } })`],
  tagNameThrows: ['<x-bad>hi</x-bad>', `customElements.define('x-bad', class extends HTMLElement { get tagName(){ throw new Error('tn') } get localName(){ throw new Error('ln') } })`],
  textContentThrows: ['<button><x-bad>hi</x-bad></button>', `customElements.define('x-bad', class extends HTMLElement { get textContent(){ throw new Error('tc') } get innerText(){ throw new Error('it') } })`],
  roleGetterLies: ['<x-bad></x-bad>', `customElements.define('x-bad', class extends HTMLElement { get role(){ return 'button' } })`],
  gbcrThrowsOne: ['<x-bad>hi</x-bad>', `customElements.define('x-bad', class extends HTMLElement { getBoundingClientRect(){ throw new Error('gbcr') } getClientRects(){ throw new Error('gcr') } })`],
  focusMutates: ['<x-bad tabindex="0">hi</x-bad>', `customElements.define('x-bad', class extends HTMLElement { focus(){ document.body.insertAdjacentHTML('beforeend','<img src=zz>'); } })`],
  focusinMutates: ['', `let n=0;document.addEventListener('focusin',()=>{ if(n++<1000) document.body.insertAdjacentHTML('beforeend','<button></button>'); })`],
  focusinRemovesTarget: ['', `document.addEventListener('focusin',(e)=>{ try{e.target.remove()}catch{} })`],
  blurMovesFocus: ['', `document.addEventListener('focusout',(e)=>{ const b=document.getElementById('l'); if(b && e.target!==b) b.focus(); })`],
  mutationObserverChurn: ['', `let n=0;new MutationObserver(()=>{ if(n++<200) document.body.appendChild(document.createElement('img')); }).observe(document,{subtree:true,attributes:true,childList:true,characterData:true})`],
  attrChangedCallbackMutates: ['<x-bad data-a="1" role="button"></x-bad>', `customElements.define('x-bad', class extends HTMLElement { static get observedAttributes(){return ['style','class','aria-hidden','tabindex','data-a','inert']} attributeChangedCallback(){ this.parentNode && this.parentNode.appendChild(document.createElement('img')) } })`],
  connectedCallbackLoop: ['<x-bad></x-bad>', `customElements.define('x-bad', class extends HTMLElement { connectedCallback(){ if(!this.__d){this.__d=1; this.appendChild(document.createElement('img'))} } })`],
  scrollHandlerMutates: ['<div style="height:3000px"></div>', `addEventListener('scroll',()=>{ document.body.appendChild(document.createElement('img')) },true)`],
  resizeObserverMutates: ['', `new ResizeObserver(()=>{document.body.appendChild(document.createElement('img'))}).observe(document.body)`],
  selectionChangeMutates: ['', `document.addEventListener('selectionchange',()=>{document.body.appendChild(document.createElement('img'))})`],
  styleRecalcThrowsInGetter: ['<x-bad>hi</x-bad>', `Object.defineProperty(HTMLElement.prototype,'hidden',{get(){throw new Error('hidden')},configurable:true})`],
  infiniteGetterOnOne: ['<x-bad>hi</x-bad>', `customElements.define('x-bad', class extends HTMLElement { get shadowRoot(){ const t=Date.now(); while(Date.now()-t<3000){} return null } })`],
  slowGetAttribute: ['', `const g=Element.prototype.getAttribute;Element.prototype.getAttribute=function(n){ for(let i=0;i<2000;i++); return g.call(this,n)}`],
  ariaHiddenFlipOnFocus: ['<div id="c" aria-hidden="true"><a href="#">in hidden</a></div>', `document.addEventListener('focusin',(e)=>{ const c=document.getElementById('c'); c.setAttribute('aria-hidden', c.contains(e.target)?'false':'true') })`],
};
(async () => {
  const only = process.argv[2];
  for (const [name, [pre, script]] of Object.entries(V)) {
    if (only && name !== only) continue;
    // control: the same "pre" markup with an inert element name / no script
    const ctl = await h.runChromium(mk(pre.replace(/x-bad/g, 'x-good'), ''), {}, { timeoutMs: 30000 });
    const res = await h.runChromium(mk(pre, script), {}, { timeoutMs: 30000, post: () => document.querySelectorAll('img').length + '/' + document.body.children.length + '/' + (document.activeElement && document.activeElement.tagName) });
    if (res.err) { console.log(JSON.stringify({ name, status: res.hung ? 'HANG' : 'THROW', err: res.err.slice(0, 300) })); continue; }
    const a = h.summarize(ctl.r), b = h.summarize(res.r);
    const diffs = Object.keys(a).filter((k) => a[k] !== b[k]).map((k) => `${k}: ${a[k]} -> ${b[k]}`);
    console.log(JSON.stringify({ name, ms: Math.round(res.ms), ctlMs: Math.round(ctl.ms), ndiff: diffs.length, diffs: diffs.slice(0, 8), post: res.post, pageErrors: res.pageErrors.slice(0, 2) }));
  }
  await h.closeBrowser();
})();
