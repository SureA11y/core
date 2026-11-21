'use strict';
// Hostile pages in Chromium: page scripts override built-ins / clobber DOM properties before the bundle is injected.
// For each case: does the scan throw, do rules error, does the result differ from the same markup without the hostile script?
// node hostile-chrome.js [filter]
const C = require('./chrome-lib.js');
const L = require('./lib.js');
const BODY = `<header><nav aria-label="Main"><a href="/a">Home</a> <a href="#main">Skip</a></nav></header>
<main id="main"><h1>Shop</h1><p style="color:#999">Low contrast text</p>
<form id="f" name="f"><label for="q">Search</label><input id="q" name="q"><input name="elements"><input name="length"><input name="action"><button>Go</button></form>
<img src="a.png"><button></button><div role="button" tabindex="0">fake</div><a href="#"></a>
<ul><li>a</li></ul><table><tr><th>h</th></tr><tr><td>c</td></tr></table>
<span id="t">Title</span><button aria-labelledby="t missing"></button>
<div id="host"></div><select><option>1</option></select></main>`;
const PAGE = (head) => `<!DOCTYPE html><html lang="en"><head><title>T</title>${head}</head><body>${BODY}
<script>const h=document.getElementById('host');if(h&&h.attachShadow&&!h.shadowRoot){try{h.attachShadow({mode:'open'}).innerHTML='<button></button><img src=x>'}catch(e){}}</script></body></html>`;
const S = (js) => `<script>${js}</script>`;
const cases = {
  clean: '',
  arrayMap: S(`Array.prototype.map=function(){return []};`),
  arrayFilterThrows: S(`Array.prototype.filter=function(){throw new Error('nope')};`),
  arrayFrom: S(`Array.from=function(){return []};`),
  arrayIterator: S(`Array.prototype[Symbol.iterator]=function*(){};`),
  arrayPushThrows: S(`Array.prototype.push=function(){throw new Error('push')};`),
  arrayIndexOf: S(`Array.prototype.indexOf=function(){return -1};Array.prototype.includes=function(){return false};`),
  arraySort: S(`Array.prototype.sort=function(){return this.reverse()};`),
  arrayForEach: S(`Array.prototype.forEach=function(){};`),
  arrayReduce: S(`Array.prototype.reduce=function(){return 0};`),
  arraySliceConcat: S(`Array.prototype.slice=function(){return []};Array.prototype.concat=function(){return []};`),
  mapSet: S(`window.Map=function(){return {get(){},set(){},has(){return false}}};window.Set=function(){return {add(){},has(){return false}}};window.WeakMap=window.Map;`),
  mapProtoGet: S(`Map.prototype.get=function(){return undefined};Map.prototype.has=function(){return false};`),
  setProtoAdd: S(`Set.prototype.add=function(){return this};Set.prototype.has=function(){return true};`),
  weakmap: S(`WeakMap.prototype.get=function(){return {}};WeakMap.prototype.has=function(){return true};`),
  jsonStringify: S(`JSON.stringify=function(){return '"x"'};JSON.parse=function(){return {}};`),
  objectKeys: S(`Object.keys=function(){return []};Object.entries=function(){return []};Object.assign=function(t){return t};`),
  objectDefine: S(`Object.defineProperty=function(o){return o};Object.freeze=function(o){return o};`),
  objectCreate: S(`Object.create=function(){return {}};`),
  fnCallApply: S(`Function.prototype.call=function(){return undefined};Function.prototype.apply=function(){return undefined};`),
  fnBind: S(`Function.prototype.bind=function(){return function(){}};`),
  stringProto: S(`String.prototype.trim=function(){return 'x'};String.prototype.toLowerCase=function(){return 'Q'};String.prototype.split=function(){return []};String.prototype.replace=function(){return ''};`),
  stringIncludes: S(`String.prototype.includes=function(){return true};String.prototype.startsWith=function(){return true};String.prototype.indexOf=function(){return 0};`),
  regexpExec: S(`RegExp.prototype.exec=function(){return null};RegExp.prototype.test=function(){return true};`),
  regexpCtor: S(`window.RegExp=function(){throw new Error('re')};`),
  mathMax: S(`Math.max=function(){return NaN};Math.min=function(){return NaN};Math.round=function(){return 7};`),
  numberParse: S(`window.parseFloat=function(){return NaN};window.parseInt=function(){return 0};Number.isFinite=function(){return false};`),
  promise: S(`window.Promise=function(){throw new Error('p')};`),
  symbol: S(`Symbol.iterator; Object.defineProperty(Array.prototype,Symbol.iterator,{get(){throw new Error('it')}});`),
  getComputedStyle: S(`window.getComputedStyle=function(){return {getPropertyValue(){return ''},display:'block'}};`),
  getComputedStyleThrows: S(`window.getComputedStyle=function(){throw new Error('gcs')};`),
  gbcr: S(`Element.prototype.getBoundingClientRect=function(){return {x:0,y:0,width:0,height:0,top:0,left:0,right:0,bottom:0}};Element.prototype.getClientRects=function(){return []};`),
  gbcrThrows: S(`Element.prototype.getBoundingClientRect=function(){throw new Error('gbcr')};`),
  qsaThrows: S(`Element.prototype.querySelectorAll=function(){throw new Error('qsa')};Document.prototype.querySelectorAll=function(){throw new Error('qsa')};`),
  qsReturnsNull: S(`Element.prototype.querySelector=function(){return null};Document.prototype.querySelector=function(){return null};Document.prototype.getElementById=function(){return null};`),
  getAttribute: S(`Element.prototype.getAttribute=function(){return 'x'};Element.prototype.hasAttribute=function(){return true};`),
  getAttributeThrows: S(`Element.prototype.getAttribute=function(){throw new Error('ga')};`),
  setAttributeThrows: S(`Element.prototype.setAttribute=function(){throw new Error('sa')};Element.prototype.removeAttribute=function(){throw new Error('ra')};`),
  nodeGetters: S(`for(const p of ['parentNode','parentElement','firstChild','nextSibling','childNodes','children']){Object.defineProperty(Node.prototype,p,{get(){return null},configurable:true})}`),
  elementGetters: S(`for(const p of ['tagName','localName','id','className','attributes','shadowRoot','innerHTML','outerHTML']){try{Object.defineProperty(Element.prototype,p,{get(){return 'zz'},configurable:true})}catch(e){}}`),
  textContent: S(`Object.defineProperty(Node.prototype,'textContent',{get(){return 'X'},configurable:true});Object.defineProperty(HTMLElement.prototype,'innerText',{get(){return 'X'},configurable:true});`),
  treeWalker: S(`Document.prototype.createTreeWalker=function(){throw new Error('tw')};Document.prototype.createNodeIterator=function(){throw new Error('ni')};`),
  matches: S(`Element.prototype.matches=function(){return true};Element.prototype.closest=function(){return null};`),
  contains: S(`Node.prototype.contains=function(){return true};Node.prototype.getRootNode=function(){return document};`),
  elementFromPoint: S(`Document.prototype.elementFromPoint=function(){return document.body};Document.prototype.elementsFromPoint=function(){return []};ShadowRoot.prototype.elementFromPoint=function(){return null}`),
  focusBlur: S(`HTMLElement.prototype.focus=function(){throw new Error('f')};HTMLElement.prototype.blur=function(){throw new Error('b')};`),
  dispatch: S(`EventTarget.prototype.addEventListener=function(){throw new Error('ael')};EventTarget.prototype.dispatchEvent=function(){return false};`),
  scrollTo: S(`window.scrollTo=function(){throw new Error('st')};window.scroll=window.scrollTo;Element.prototype.scrollIntoView=function(){throw new Error('siv')};`),
  rafTimeout: S(`window.requestAnimationFrame=function(){throw new Error('raf')};window.setTimeout=function(){throw new Error('st')};`),
  cssEscape: S(`window.CSS={escape(){return '*'},supports(){return false}};`),
  cssEscapeDeleted: S(`delete window.CSS;`),
  getAnimations: S(`Document.prototype.getAnimations=function(){throw new Error('ga')};Element.prototype.getAnimations=function(){throw new Error('ga')};`),
  matchMedia: S(`window.matchMedia=function(){return {matches:true,addListener(){},addEventListener(){}}};`),
  matchMediaThrows: S(`window.matchMedia=function(){throw new Error('mm')};`),
  performance: S(`window.performance={now(){return NaN}};`),
  dateNow: S(`Date.now=function(){return NaN};`),
  consoleThrows: S(`console.warn=function(){throw new Error('cw')};console.error=console.warn;console.log=console.warn;console.info=console.warn;`),
  windowModule: S(`window.module={exports:{}};window.exports={};window.define=function(){throw new Error('amd')};window.define.amd=true;`),
  globalA11ycore: S(`Object.defineProperty(window,'a11ycore',{value:{bad:1},writable:false,configurable:false});`),
  nodeFilter: S(`window.NodeFilter={SHOW_ELEMENT:0,SHOW_TEXT:0,FILTER_ACCEPT:2,FILTER_SKIP:1,FILTER_REJECT:1};`),
  intl: S(`window.Intl={};String.prototype.localeCompare=function(){return 1};`),
  objectProtoPollute: S(`Object.prototype.length=3;Object.prototype.role='button';Object.prototype.error='x';Object.prototype.toJSON=undefined;Object.prototype.selector='x';Object.prototype.outcome='fail';Object.prototype['0']='zero';Object.prototype.then=undefined;`),
  objectProtoGetterThrows: S(`Object.defineProperty(Object.prototype,'type',{get(){throw new Error('type')},set(v){Object.defineProperty(this,'type',{value:v,writable:true,enumerable:true,configurable:true})},configurable:true});`),
  arrayProtoIndex: S(`Object.defineProperty(Array.prototype,'0',{get(){return 'z'},set(v){Object.defineProperty(this,'0',{value:v,writable:true,enumerable:true,configurable:true})},configurable:true});`),
  domClobberDoc: `<img name="getElementById"><img name="querySelectorAll"><img name="querySelector"><img name="createTreeWalker"><img name="documentElement"><img name="body"><img name="defaultView"><img name="activeElement"><img name="styleSheets"><img name="createElement"><img name="title"><img name="location"><img name="head"><form name="forms"></form><img name="getElementsByTagName"><img name="contains"><img name="elementFromPoint"><img name="adoptedStyleSheets"><img name="getAnimations"><img name="nodeType"><img name="ownerDocument"><img name="compatMode"><img name="doctype"><img name="dir"><img name="lang">`,
  domClobberForm: '',
  frozenProtos: S(`Object.freeze(Object.prototype);Object.freeze(Array.prototype);Object.freeze(Map.prototype);Object.freeze(Function.prototype);`),
  customElementThrows: S(`customElements.define('x-bad',class extends HTMLElement{constructor(){super();}connectedCallback(){throw new Error('cc')}static get observedAttributes(){return ['aria-label','role','tabindex','style','class','data-x']}attributeChangedCallback(){throw new Error('acc')}get shadowRoot(){throw new Error('sr')}get tagName(){throw new Error('tn')}getAttribute(){throw new Error('ga')}get textContent(){throw new Error('tc')}get childNodes(){throw new Error('cn')}getBoundingClientRect(){throw new Error('gbcr')}focus(){throw new Error('f')}});`) ,
  proxyGlobals: S(`window.document.defaultView;Object.defineProperty(window,'document',{get(){return document}});window.Element=new Proxy(Element,{get(t,k){if(k==='prototype')return t.prototype;throw new Error('E.'+String(k))}});`),
  toStringTag: S(`Object.defineProperty(HTMLButtonElement.prototype,Symbol.toStringTag,{value:'HTMLDivElement'});Object.prototype.toString=function(){return '[object Object]'};`),
  nodeTypeLie: S(`Object.defineProperty(Node.prototype,'nodeType',{get(){return 1},configurable:true});`)
};
// form-level clobbering: names already in BODY (elements, length, action); add more
cases.domClobberForm = '';
const extraForm = `<form id="clob"><input name="attributes"><input name="id"><input name="nodeName"><input name="tagName"><input name="parentNode"><input name="childNodes"><input name="children"><input name="getAttribute"><input name="hasAttribute"><input name="querySelectorAll"><input name="querySelector"><input name="matches"><input name="closest"><input name="localName"><input name="namespaceURI"><input name="ownerDocument"><input name="style"><input name="className"><input name="classList"><input name="shadowRoot"><input name="firstChild"><input name="nextSibling"><input name="nodeType"><input name="getRootNode"><input name="getBoundingClientRect"><input name="getClientRects"><input name="textContent"><input name="innerText"><input name="hidden"><input name="contains"><input name="role"><input name="ariaLabel"><input name="title"><input name="lang"><input name="dir"><input name="tabIndex"><input name="checkVisibility"><input name="getAnimations"><input name="computedStyleMap"><input name="assignedSlot"><input name="hasAttributes"><input name="getAttributeNames"><input name="isConnected"><input name="labels"><input name="name"><input name="method"><input name="target"><input name="submit"><input name="reset"><input name="checkValidity"><input name="__proto__"><input name="constructor"><label>Clobbered <input name="toString"></label><button name="valueOf">ok</button></form>`;
const filter = process.argv[2];
function summarize(r) {
  return r.checksResults.map((c) => c.ruleId + ':' + c.outcome + ':' + c.occurrences.length);
}
(async () => {
  const b = await C.launch();
  async function run(name, head, extra = '') {
    const p = await b.newPage();
    const pageErrors = [];
    p.on('pageerror', (e) => pageErrors.push(e.message));
    let html = PAGE(head);
    if (extra) html = html.replace('</main>', extra + '</main>');
    let res;
    try {
      await p.setContent(html, { timeout: 20000 });
      await p.evaluate(C.BUNDLE);
      res = await p.evaluate(() => {
        try {
          const api = window.a11ycore && window.a11ycore.runa11yCoreInPage ? window.a11ycore : null;
          if (!api) return { noApi: true, type: typeof window.a11ycore };
          const r = api.runa11yCoreInPage(null, null, {}, null);
          return { r: JSON.parse(JSON.stringify(r)) };
        } catch (e) { return { thrown: String(e && e.stack || e).slice(0, 500) }; }
      });
    } catch (e) { res = { thrown: 'evaluate: ' + String(e.message).slice(0, 300) }; }
    await p.close().catch(() => {});
    return { res: res || { thrown: 'no result' }, pageErrors };
  }
  const clean = await run('clean', '');
  const cleanSum = summarize(clean.res.r);
  const cleanForm = await run('cleanForm', '', extraForm.replace(/name="[^"]*"/g, (m, i) => 'name="n' + Math.random().toString(36).slice(2, 6) + '"'));
  const cleanFormSum = summarize(cleanForm.res.r);
  for (const [name, head] of Object.entries(cases)) {
    if (name === 'clean' || (filter && !name.includes(filter))) continue;
    const extra = name === 'domClobberForm' ? extraForm : '';
    const { res, pageErrors } = await run(name, head, extra);
    const out = { name };
    if (res.thrown) out.thrown = res.thrown;
    if (res.noApi) out.noApi = res.type;
    if (res.r) {
      const errs = res.r.checksResults.filter((c) => c.error).map((c) => c.ruleId + ': ' + String(c.error).slice(0, 140));
      out.errors = errs.length; out.errorSample = errs.slice(0, 4);
      const base = extra ? cleanFormSum : cleanSum;
      const s = summarize(res.r);
      const diffs = s.filter((x, i) => x !== base[i]).map((x, i) => x);
      out.diffs = diffs.length; out.diffSample = diffs.slice(0, 8);
      out.inv = L.checkInvariants(res.r, name).filter((x) => !/error:/.test(x)).slice(0, 3);
    }
    if (pageErrors.length) out.pageErrors = pageErrors.slice(0, 2);
    console.log(JSON.stringify(out));
  }
  await b.close();
})();
