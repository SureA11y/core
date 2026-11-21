'use strict';
// Poisons one built-in at a time (after the page loads, before the bundle),
// scans the combined-fixtures page, and compares with an unpoisoned scan.
// A verdict change without PAGE_BUILTINS_BROKEN is what we look for.
const fs = require('node:fs');
const { serve, launch, addBundle, scanSummary, diff } = require('./lib');

const throwing = (path) => `(()=>{const [o,k]=${JSON.stringify(path)};const t=eval(o);const d=Object.getOwnPropertyDescriptor(t,k);if(d&&d.get){Object.defineProperty(t,k,{...d,get(){throw new Error('poison')}})}else{t[k]=function(){throw new Error('poison')}}})()`;
const wrap = (o, k, body) => `(()=>{const t=${o};const orig=t[${JSON.stringify(k)}];t[${JSON.stringify(k)}]=function(...a){${body}}})()`;

const P = [];
const add = (name, code) => P.push([name, code]);
// Array.prototype — wrong results
add('Array.indexOf->-1', wrap('Array.prototype', 'indexOf', 'return -1'));
add('Array.indexOf(fromIndex ignored)', wrap('Array.prototype', 'indexOf', 'return orig.call(this,a[0])'));
add('Array.lastIndexOf->-1', wrap('Array.prototype', 'lastIndexOf', 'return -1'));
add('Array.join->""', wrap('Array.prototype', 'join', 'return ""'));
add('Array.join(sep ignored)', wrap('Array.prototype', 'join', 'return orig.call(this)'));
add('Array.sort no-op', wrap('Array.prototype', 'sort', 'return this'));
add('Array.sort(cmp ignored)', wrap('Array.prototype', 'sort', 'return orig.call(this)'));
add('Array.reverse no-op', wrap('Array.prototype', 'reverse', 'return this'));
add('Array.splice no-op', wrap('Array.prototype', 'splice', 'return []'));
add('Array.pop->undef', wrap('Array.prototype', 'pop', 'return undefined'));
add('Array.shift->undef', wrap('Array.prototype', 'shift', 'return undefined'));
add('Array.unshift no-op', wrap('Array.prototype', 'unshift', 'return this.length'));
add('Array.flat->copy', wrap('Array.prototype', 'flat', 'return this.slice()'));
add('Array.flatMap->map', wrap('Array.prototype', 'flatMap', 'return this.map(a[0])'));
add('Array.fill no-op', wrap('Array.prototype', 'fill', 'return this'));
add('Array.findLast->undef', wrap('Array.prototype', 'findLast', 'return undefined'));
add('Array.at->undef', wrap('Array.prototype', 'at', 'return undefined'));
add('Array.keys->[]', wrap('Array.prototype', 'keys', 'return [][Symbol.iterator]()'));
add('Array.entries->[]', wrap('Array.prototype', 'entries', 'return [][Symbol.iterator]()'));
add('Array.values->[]', wrap('Array.prototype', 'values', 'return [][Symbol.iterator]()'));
add('Array.of->[]', wrap('Array', 'of', 'return []'));
add('Array.includes->false', wrap('Array.prototype', 'includes', 'return false'));
add('Array.toSorted no-op', wrap('Array.prototype', 'toSorted', 'return this.slice()'));
// String.prototype
add('String.indexOf->-1', wrap('String.prototype', 'indexOf', 'return -1'));
add('String.lastIndexOf->-1', wrap('String.prototype', 'lastIndexOf', 'return -1'));
add('String.includes->false', wrap('String.prototype', 'includes', 'return false'));
add('String.includes(MooTools contains style, pos ignored)', wrap('String.prototype', 'includes', 'return orig.call(this,a[0])'));
add('String.slice->""', wrap('String.prototype', 'slice', 'return ""'));
add('String.substring->""', wrap('String.prototype', 'substring', 'return ""'));
add('String.substr->""', wrap('String.prototype', 'substr', 'return ""'));
add('String.charAt->""', wrap('String.prototype', 'charAt', 'return ""'));
add('String.charCodeAt->0', wrap('String.prototype', 'charCodeAt', 'return 0'));
add('String.codePointAt->0', wrap('String.prototype', 'codePointAt', 'return 0'));
add('String.padStart->this', wrap('String.prototype', 'padStart', 'return String(this)'));
add('String.repeat->""', wrap('String.prototype', 'repeat', 'return ""'));
add('String.match->null', wrap('String.prototype', 'match', 'return null'));
add('String.matchAll->[]', wrap('String.prototype', 'matchAll', 'return [][Symbol.iterator]()'));
add('String.search->-1', wrap('String.prototype', 'search', 'return -1'));
add('String.replaceAll->this', wrap('String.prototype', 'replaceAll', 'return String(this)'));
add('String.toUpperCase->this', wrap('String.prototype', 'toUpperCase', 'return String(this)'));
add('String.trimStart->this', wrap('String.prototype', 'trimStart', 'return String(this)'));
add('String.trimEnd->this', wrap('String.prototype', 'trimEnd', 'return String(this)'));
add('String.normalize->this', wrap('String.prototype', 'normalize', 'return String(this)'));
add('String.localeCompare->0', wrap('String.prototype', 'localeCompare', 'return 0'));
add('String.endsWith->false', wrap('String.prototype', 'endsWith', 'return false'));
add('String.concat->this', wrap('String.prototype', 'concat', 'return String(this)'));
add('String.at->undef', wrap('String.prototype', 'at', 'return undefined'));
add('String.toLocaleLowerCase->this', wrap('String.prototype', 'toLocaleLowerCase', 'return String(this)'));
add('String.split(limit ignored)', wrap('String.prototype', 'split', 'return orig.call(this,a[0])'));
add('String.trim (Prototype strip-like, keeps nbsp)', wrap('String.prototype', 'trim', 'return String(this).replace(/^[ \\t\\n\\r]+|[ \\t\\n\\r]+$/g,"")'));
add('String.fromCharCode->""', wrap('String', 'fromCharCode', 'return ""'));
add('String.fromCodePoint->""', wrap('String', 'fromCodePoint', 'return ""'));
add('String.raw', wrap('String', 'raw', 'return ""'));
// Object
add('Object.entries->[]', wrap('Object', 'entries', 'return []'));
add('Object.values->[]', wrap('Object', 'values', 'return []'));
add('Object.freeze no-op', wrap('Object', 'freeze', 'return a[0]'));
add('Object.create->{}', wrap('Object', 'create', 'return {}'));
add('Object.getPrototypeOf->null', wrap('Object', 'getPrototypeOf', 'return null'));
add('Object.getOwnPropertyNames->[]', wrap('Object', 'getOwnPropertyNames', 'return []'));
add('Object.getOwnPropertyDescriptor->undef', wrap('Object', 'getOwnPropertyDescriptor', 'return undefined'));
add('Object.fromEntries->{}', wrap('Object', 'fromEntries', 'return {}'));
add('Object.is->false', wrap('Object', 'is', 'return false'));
add('Object.defineProperty no-op', wrap('Object', 'defineProperty', 'return a[0]'));
add('Object.prototype.toString->x', wrap('Object.prototype', 'toString', 'return "[object Object]"'));
add('Object.prototype.propertyIsEnumerable->false', wrap('Object.prototype', 'propertyIsEnumerable', 'return false'));
add('Object.hasOwn->false', wrap('Object', 'hasOwn', 'return false'));
add('Object.setPrototypeOf no-op', wrap('Object', 'setPrototypeOf', 'return a[0]'));
// Object.prototype value properties (not getters): enumerable pollution
add('Object.prototype.role="button" (value)', 'Object.prototype.role="button"');
add('Object.prototype.length=1 (value)', 'Object.prototype.length=1');
add('Object.prototype.name="x" (value)', 'Object.prototype.name="x"');
add('Object.prototype.type="x" (value)', 'Object.prototype.type="x"');
add('Object.prototype.outcome="pass" (value)', 'Object.prototype.outcome="pass"');
add('Object.prototype.hidden=true (value)', 'Object.prototype.hidden=true');
add('Object.prototype.value="x" (value)', 'Object.prototype.value="x"');
add('Object.prototype.toJSON fn', 'Object.prototype.toJSON=function(){return {}}');
add('Object.prototype enumerable fn each', 'Object.defineProperty(Object.prototype,"each",{value:function(){},enumerable:true,writable:true,configurable:true})');
add('Array.prototype enumerable fn', 'Array.prototype.remove=function(){}');
add('Array.prototype.toJSON (Prototype 1.6)', 'Array.prototype.toJSON=function(){return "x"}');
add('String.prototype.toJSON', 'String.prototype.toJSON=function(){return "x"}');
// Numbers / Math
add('parseInt->NaN', 'window.parseInt=()=>NaN');
add('Number.parseInt->NaN', 'Number.parseInt=()=>NaN');
add('isNaN->false', 'window.isNaN=()=>false');
add('Number.isNaN->false', 'Number.isNaN=()=>false');
add('Number->0', '');
add('Number.prototype.toFixed->"0"', wrap('Number.prototype', 'toFixed', 'return "0"'));
add('Number.isInteger->false', 'Number.isInteger=()=>false');
add('Math.floor->x', 'Math.floor=x=>x');
add('Math.ceil->x', 'Math.ceil=x=>x');
add('Math.pow->0', 'Math.pow=()=>0');
add('Math.sqrt->0', 'Math.sqrt=()=>0');
add('Math.hypot->0', 'Math.hypot=()=>0');
add('Math.trunc->x', 'Math.trunc=x=>x');
add('Math.sign->0', 'Math.sign=()=>0');
add('Math.log10->0', 'Math.log10=()=>0');
add('Math.random->0', 'Math.random=()=>0');
add('Math.max(only 2 args)', 'const m=Math.max;Math.max=(a,b)=>m(a,b)');
add('Math.min(only 2 args)', 'const m=Math.min;Math.min=(a,b)=>m(a,b)');
add('Date.now->0', 'Date.now=()=>0');
add('performance.now->0', 'performance.now=()=>0');
// JSON
add('JSON.parse->{}', 'JSON.parse=()=>({})');
add('JSON.parse throws', 'JSON.parse=()=>{throw new Error("p")}');
add('JSON.stringify (Prototype 1.6 style: arrays via toJSON)', 'Array.prototype.toJSON=function(){return JSON.stringify(this.slice())}');
// collections
add('Map.prototype.delete no-op', wrap('Map.prototype', 'delete', 'return false'));
add('Map.prototype.forEach no-op', wrap('Map.prototype', 'forEach', 'return'));
add('Map.prototype.keys->[]', wrap('Map.prototype', 'keys', 'return [][Symbol.iterator]()'));
add('Map.prototype.clear no-op', wrap('Map.prototype', 'clear', 'return'));
add('Set.prototype.delete no-op', wrap('Set.prototype', 'delete', 'return false'));
add('Set.prototype.forEach no-op', wrap('Set.prototype', 'forEach', 'return'));
add('Set.prototype.values->[]', wrap('Set.prototype', 'values', 'return [][Symbol.iterator]()'));
add('WeakSet.prototype.has->false', wrap('WeakSet.prototype', 'has', 'return false'));
add('WeakSet.prototype.add no-op', wrap('WeakSet.prototype', 'add', 'return this'));
add('WeakMap.prototype.has->false', wrap('WeakMap.prototype', 'has', 'return false'));
add('WeakMap.prototype.set no-op', wrap('WeakMap.prototype', 'set', 'return this'));
add('Map.prototype.set no-op', wrap('Map.prototype', 'set', 'return this'));
add('Set.prototype.add no-op', wrap('Set.prototype', 'add', 'return this'));
add('Map.prototype.has->false', wrap('Map.prototype', 'has', 'return false'));
add('Set.prototype.has->false', wrap('Set.prototype', 'has', 'return false'));
add('Map.prototype.get->undef', wrap('Map.prototype', 'get', 'return undefined'));
// RegExp
add('RegExp.prototype[Symbol.replace] identity', 'RegExp.prototype[Symbol.replace]=function(s){return String(s)}');
add('RegExp.prototype[Symbol.split] whole', 'RegExp.prototype[Symbol.split]=function(s){return [String(s)]}');
add('RegExp.prototype[Symbol.match]->null', 'RegExp.prototype[Symbol.match]=function(){return null}');
add('RegExp.prototype.exec->null', wrap('RegExp.prototype', 'exec', 'return null'));
add('Symbol.iterator on Array.prototype -> empty', 'Array.prototype[Symbol.iterator]=function(){return [].values.call([])}');
// Functions
add('Function.prototype.call broken', 'Function.prototype.call=function(){return undefined}');
add('Function.prototype.apply broken', 'Function.prototype.apply=function(){return undefined}');
add('Function.prototype.bind (old polyfill, no partial)', 'const b=Function.prototype.bind;Function.prototype.bind=function(t){return b.call(this,t)}');
// Promise / timers
add('Promise removed', 'window.Promise=undefined');
add('Promise.prototype.then no-op', 'Promise.prototype.then=function(){return this}');
add('Promise.resolve->never', 'Promise.resolve=()=>new Promise(()=>{})');
add('Promise.all->never', 'Promise.all=()=>new Promise(()=>{})');
add('setTimeout no-op', 'window.setTimeout=()=>0');
add('requestAnimationFrame no-op', 'window.requestAnimationFrame=()=>0');
add('queueMicrotask removed', 'window.queueMicrotask=undefined');
add('MutationObserver removed', 'window.MutationObserver=undefined');
add('MutationObserver no-op', 'window.MutationObserver=class{observe(){}disconnect(){}takeRecords(){return []}}');
add('ResizeObserver removed', 'window.ResizeObserver=undefined');
add('IntersectionObserver removed', 'window.IntersectionObserver=undefined');
// CSSOM / layout
add('getComputedStyle throws', throwing(['window', 'getComputedStyle']));
add('getComputedStyle -> element.style', 'window.getComputedStyle=e=>e.style');
add('getComputedStyle pseudo ignored', 'const g=window.getComputedStyle;window.getComputedStyle=(e)=>g(e)');
add('CSSStyleDeclaration.getPropertyValue->""', wrap('CSSStyleDeclaration.prototype', 'getPropertyValue', 'return ""'));
add('matchMedia->matches false', 'window.matchMedia=q=>({matches:false,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}})');
add('matchMedia removed', 'window.matchMedia=undefined');
add('CSS.supports->false', 'CSS.supports=()=>false');
add('CSS.escape removed', 'CSS.escape=undefined');
add('CSS.escape identity', 'CSS.escape=x=>x');
add('Element.getBoundingClientRect zeros', wrap('Element.prototype', 'getBoundingClientRect', 'return new DOMRect(0,0,0,0)'));
add('Element.getClientRects empty', wrap('Element.prototype', 'getClientRects', 'return []'));
add('Range.getClientRects empty', wrap('Range.prototype', 'getClientRects', 'return []'));
add('Range.getBoundingClientRect zeros', wrap('Range.prototype', 'getBoundingClientRect', 'return new DOMRect(0,0,0,0)'));
add('document.elementFromPoint->null', wrap('Document.prototype', 'elementFromPoint', 'return null'));
add('document.elementsFromPoint->[]', wrap('Document.prototype', 'elementsFromPoint', 'return []'));
add('Element.checkVisibility->true', wrap('Element.prototype', 'checkVisibility', 'return true'));
add('Element.checkVisibility removed', 'delete Element.prototype.checkVisibility');
add('Element.getAnimations->[]', wrap('Element.prototype', 'getAnimations', 'return []'));
add('document.getAnimations->[]', wrap('Document.prototype', 'getAnimations', 'return []'));
add('scrollTo no-op', 'window.scrollTo=()=>{};window.scroll=()=>{};Element.prototype.scrollTo=function(){};Element.prototype.scrollIntoView=function(){}');
// DOM
add('Element.getAttribute->null', wrap('Element.prototype', 'getAttribute', 'return null'));
add('Element.getAttribute throws', throwing(['Element.prototype', 'getAttribute']));
add('Element.hasAttribute->false', wrap('Element.prototype', 'hasAttribute', 'return false'));
add('Element.matches->false', wrap('Element.prototype', 'matches', 'return false'));
add('Element.matches throws', throwing(['Element.prototype', 'matches']));
add('Element.closest->null', wrap('Element.prototype', 'closest', 'return null'));
add('Element.querySelectorAll->[]', wrap('Element.prototype', 'querySelectorAll', 'return document.createDocumentFragment().querySelectorAll("x")'));
add('Document.querySelectorAll->[]', wrap('Document.prototype', 'querySelectorAll', 'return document.createDocumentFragment().querySelectorAll("x")'));
add('Document.getElementById->null', wrap('Document.prototype', 'getElementById', 'return null'));
add('Node.contains->false', wrap('Node.prototype', 'contains', 'return false'));
add('Node.getRootNode->document', wrap('Node.prototype', 'getRootNode', 'return document'));
add('Node.compareDocumentPosition->0', wrap('Node.prototype', 'compareDocumentPosition', 'return 0'));
add('Document.createTreeWalker throws', throwing(['Document.prototype', 'createTreeWalker']));
add('Document.createRange throws', throwing(['Document.prototype', 'createRange']));
add('Element.attachShadow patched (polyfill)', 'const a=Element.prototype.attachShadow;Element.prototype.attachShadow=function(o){return a.call(this,o)}');
add('EventTarget.addEventListener (zone-like wrapper)', 'const a=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,f,o){return a.call(this,t,f,o)}');
add('EventTarget.addEventListener no-op', wrap('EventTarget.prototype', 'addEventListener', 'return'));
add('HTMLElement.focus no-op', wrap('HTMLElement.prototype', 'focus', 'return'));
add('HTMLElement.blur no-op', wrap('HTMLElement.prototype', 'blur', 'return'));
add('Node.textContent getter ""', 'Object.defineProperty(Node.prototype,"textContent",{get(){return ""},configurable:true})');
add('Element.innerText getter ""', 'Object.defineProperty(HTMLElement.prototype,"innerText",{get(){return ""},configurable:true})');
add('Element.children getter throws', 'Object.defineProperty(Element.prototype,"children",{get(){throw new Error("p")},configurable:true})');
add('Node.childNodes getter throws', 'Object.defineProperty(Node.prototype,"childNodes",{get(){throw new Error("p")},configurable:true})');
add('Element.tagName lowercase', 'const d=Object.getOwnPropertyDescriptor(Element.prototype,"tagName");Object.defineProperty(Element.prototype,"tagName",{get(){return d.get.call(this).toLowerCase()},configurable:true})');
add('document.title getter ""', 'Object.defineProperty(Document.prototype,"title",{get(){return ""},configurable:true})');
add('Node.ELEMENT_NODE etc wrong', 'Object.defineProperty(Node,"ELEMENT_NODE",{value:9});Object.defineProperty(Node,"TEXT_NODE",{value:9})');
add('NodeList.prototype.forEach no-op', 'NodeList.prototype.forEach=function(){}');
add('NodeList iterator empty', 'NodeList.prototype[Symbol.iterator]=function(){return [][Symbol.iterator]()}');
add('HTMLCollection iterator empty', 'HTMLCollection.prototype[Symbol.iterator]=function(){return [][Symbol.iterator]()}');
add('DOMTokenList.contains->false', wrap('DOMTokenList.prototype', 'contains', 'return false'));
add('Intl removed', 'window.Intl=undefined');
add('Intl.Segmenter removed', 'Intl.Segmenter=undefined');
add('TextEncoder removed', 'window.TextEncoder=undefined');
add('structuredClone removed', 'window.structuredClone=undefined');
add('console.warn throws', 'console.warn=()=>{throw new Error("p")}');
add('URL throws', 'window.URL=function(){throw new Error("p")}');
add('URL removed', 'window.URL=undefined');
add('Symbol.for->new Symbol', 'Symbol.for=(k)=>Symbol(k)');
add('Reflect.ownKeys->[]', 'Reflect.ownKeys=()=>[]');
add('Reflect.apply broken', 'Reflect.apply=()=>undefined');
add('Array.prototype.push via Symbol.species (subclass)', '');

const which = process.argv[2] ? new RegExp(process.argv[2]) : null;
const list = P.filter(([n, c]) => c && (!which || which.test(n)));
const html = fs.readFileSync(__dirname + '/combined.html', 'utf8');

(async () => {
  const { base, close } = await serve({ '/c': { body: html } });
  const { browser } = await launch();
  const mk = async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    return context;
  };
  // baseline twice
  const ctx0 = await mk();
  const p0 = await ctx0.newPage();
  await p0.goto(base + '/c');
  await addBundle(p0, base);
  const baseline = await scanSummary(p0);
  await ctx0.close();
  console.log('baseline rules', Object.keys(baseline.out).length);
  const results = [];
  const N = 4;
  let idx = 0;
  const worker = async () => {
    const ctx = await mk();
    while (idx < list.length) {
      const [name, code] = list[idx++];
      const page = await ctx.newPage();
      let line;
      try {
        await page.goto(base + '/c');
        const perr = await page.evaluate((c) => { try { (0, eval)(c); return null; } catch (e) { return String(e); } }, code);
        if (perr) { line = `${name}: POISON-FAILED ${perr}`; }
        else {
          await addBundle(page, base).catch((e) => { throw new Error('addBundle ' + e.message); });
          const r = await Promise.race([scanSummary(page), new Promise((res) => setTimeout(() => res({ ok: false, msg: 'TIMEOUT 60s' }), 60000))]);
          if (!r.ok) line = `${name}: THROW ${r.code || ''} ${r.msg.slice(0, 200)}`;
          else {
            const d = diff(baseline.out, r.out);
            const errs = d.filter((x) => x.includes('ERR'));
            line = d.length ? `${name}: SILENT? ${d.length} changes (${errs.length} with error)\n     ` + d.slice(0, 8).join('\n     ') : `${name}: same`;
          }
        }
      } catch (e) {
        line = `${name}: HARNESS ${e.message.slice(0, 200)}`;
      }
      results.push(line);
      console.log(line);
      await page.close().catch(() => {});
    }
    await ctx.close();
  };
  await Promise.all(Array.from({ length: N }, worker));
  fs.writeFileSync(__dirname + '/builtin-fuzz.out.txt', results.join('\n'));
  await browser.close();
  close();
})();
