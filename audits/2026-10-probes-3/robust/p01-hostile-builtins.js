// Hostile pages: overridden builtins. Each variant = clean body + a script
// that patches something before the scan. Compares against the clean page.
const h = require('./harness');
const BODY = `<main><h1>T</h1><button></button><img src="a.png"><label>Name <input></label>
<a href="/x">Go</a><p style="color:#777;background:#fff">low contrast text</p>
<div role="button" tabindex="0"></div><input aria-labelledby="nope"><ul><div>bad</div></ul></main>`;
const page = (script) => `<!doctype html><html lang="en"><head><title>t</title></head><body>${BODY}<script>${script}</script></body></html>`;
const VARIANTS = {
  clean: '',
  gbcrThrows: `Element.prototype.getBoundingClientRect=function(){throw new Error('gbcr')}`,
  gbcrGarbage: `Element.prototype.getBoundingClientRect=function(){return {x:NaN,y:NaN,width:-5,height:Infinity,top:NaN,left:NaN,right:NaN,bottom:NaN}}`,
  gcrThrows: `Element.prototype.getClientRects=function(){throw new Error('gcr')}`,
  gcsThrows: `window.getComputedStyle=function(){throw new Error('gcs')}`,
  gcsEmpty: `window.getComputedStyle=function(){return {getPropertyValue(){return ''}}}`,
  gcsDisplayNone: `const o=getComputedStyle;window.getComputedStyle=function(e,p){const s=o.call(window,e,p);return new Proxy(s,{get(t,k){if(k==='display')return 'none';if(k==='getPropertyValue')return (n)=>n==='display'?'none':t.getPropertyValue(n);const v=t[k];return typeof v==='function'?v.bind(t):v}})}`,
  containsFalse: `Node.prototype.contains=function(){return false}`,
  containsThrows: `Node.prototype.contains=function(){throw new Error('contains')}`,
  arrayFromThrows: `Array.from=function(){throw new Error('Array.from')}`,
  arrayFromEmpty: `Array.from=function(){return []}`,
  mapBroken: `Map.prototype.get=function(){return undefined};Map.prototype.has=function(){return false}`,
  mapSetThrows: `Map.prototype.set=function(){throw new Error('Map.set')}`,
  weakMapBroken: `WeakMap.prototype.get=function(){return undefined};WeakMap.prototype.has=function(){return false}`,
  weakMapSetThrows: `WeakMap.prototype.set=function(){throw new Error('WeakMap.set')}`,
  setBroken: `Set.prototype.has=function(){return false}`,
  symbolIteratorArrayThrows: `Array.prototype[Symbol.iterator]=function(){throw new Error('iter')}`,
  nodeListIterThrows: `NodeList.prototype[Symbol.iterator]=function(){throw new Error('nliter')}`,
  jsonStringifyThrows: `JSON.stringify=function(){throw new Error('JSON')}`,
  jsonParseThrows: `JSON.parse=function(){throw new Error('JSONp')}`,
  objectKeysThrows: `Object.keys=function(){throw new Error('keys')}`,
  arrayPushThrows: `Array.prototype.push=function(){throw new Error('push')}`,
  arrayMapReturnsEmpty: `Array.prototype.map=function(){return []}`,
  arrayFilterIdentity: `Array.prototype.filter=function(){return this}`,
  stringTrimBroken: `String.prototype.trim=function(){return 'x'}`,
  stringToLowerBroken: `String.prototype.toLowerCase=function(){return String(this)+'!'}`,
  regexpExecThrows: `RegExp.prototype.exec=function(){throw new Error('re')}`,
  qsaThrows: `Document.prototype.querySelectorAll=function(){throw new Error('qsa')};Element.prototype.querySelectorAll=function(){throw new Error('eqsa')}`,
  getAttributeLies: `const g=Element.prototype.getAttribute;Element.prototype.getAttribute=function(n){return n==='alt'?'x':g.call(this,n)}`,
  hasAttributeThrows: `Element.prototype.hasAttribute=function(){throw new Error('hasAttr')}`,
  matchesThrows: `Element.prototype.matches=function(){throw new Error('matches')}`,
  closestThrows: `Element.prototype.closest=function(){throw new Error('closest')}`,
  treeWalkerThrows: `Document.prototype.createTreeWalker=function(){throw new Error('tw')}`,
  performanceNowThrows: `performance.now=function(){throw new Error('pnow')}`,
  dateNowNaN: `Date.now=function(){return NaN}`,
  mathMaxBroken: `Math.max=function(){return 0};Math.min=function(){return 0}`,
  numberIsFiniteFalse: `Number.isFinite=function(){return false}`,
  promiseGone: `window.Promise=undefined`,
  cssEscapeThrows: `CSS.escape=function(){throw new Error('esc')}`,
  cssGone: `window.CSS=undefined`,
  rangeThrows: `Document.prototype.createRange=function(){throw new Error('range')}`,
  elementFromPointThrows: `Document.prototype.elementFromPoint=function(){throw new Error('efp')};Document.prototype.elementsFromPoint=function(){throw new Error('efps')}`,
  focusThrows: `HTMLElement.prototype.focus=function(){throw new Error('focus')}`,
  getAnimationsThrows: `Document.prototype.getAnimations=function(){throw new Error('anim')};Element.prototype.getAnimations=function(){throw new Error('eanim')}`,
  objectDefinePropertyThrows: `Object.defineProperty=function(){throw new Error('dp')}`,
  functionToStringThrows: `Function.prototype.toString=function(){throw new Error('fts')}`,
  objectPrototypePolluted: `Object.prototype.role='button';Object.prototype.length=3;Object.prototype.then=function(){};Object.prototype.selector='#zz';Object.prototype.outcome='pass'`,
  arrayPrototypePolluted: `Array.prototype.foo=1;Array.prototype.includes=function(){return true}`,
  consoleGone: `window.console=undefined`,
  getterOnWindowA11ycore: `Object.defineProperty(window,'__a11ycoreEngineOptions',{get(){throw new Error('eo')},configurable:false})`,
  structuredCloneGone: `window.structuredClone=undefined`,
  intlGone: `window.Intl=undefined`,
  stringNormalizeThrows: `String.prototype.normalize=function(){throw new Error('norm')}`,
  localeCompareThrows: `String.prototype.localeCompare=function(){throw new Error('lc')}`,
  errorCtorBroken: `window.Error=function(){return {}}`,
};
(async () => {
  const only = process.argv[2];
  const base = await h.runChromium(page(''));
  const baseD = h.summarize(base.r);
  const rows = [];
  for (const [name, script] of Object.entries(VARIANTS)) {
    if (only && name !== only) continue;
    const res = await h.runChromium(page(script), {}, { timeoutMs: 60000 });
    if (res.err) { rows.push({ name, status: 'THROW/HANG', detail: res.err.split('\n').slice(0, 3).join(' | ') }); continue; }
    const s = h.summarize(res.r);
    const diffs = [];
    for (const k of Object.keys(baseD)) if (s[k] !== baseD[k]) diffs.push(`${k}: ${baseD[k]} -> ${s[k]}`);
    const errs = Object.values(s).filter((v) => /ERR:/.test(v)).length;
    rows.push({ name, status: diffs.length ? 'DIFF' : 'same', ms: Math.round(res.ms), errs, ndiff: diffs.length, sample: diffs.slice(0, 6) });
  }
  for (const r of rows) console.log(JSON.stringify(r));
  await h.closeBrowser();
})();
