'use strict';
// Built-ins outside the engine's PAGE_BUILTINS_BROKEN check: one override each, Chromium.
// Prints: does the scan throw (coded?), how many rules change outcome vs a clean page, rule errors, warnings.
const C = require('./chrome-lib.js');
const BODY = `<main><h1>Shop</h1><p style="color:#999">Low contrast text</p><img src="a.png"><button></button>
<label for="q">Search</label><input id="q"><a href="#"></a><ul><li>a</li></ul>
<table><tr><th>h</th><th>i</th></tr><tr><td>c</td><td>d</td></tr></table><div role="button" tabindex="0">fake</div></main>`;
const cases = {
  clean: '',
  slice: `Array.prototype.slice=function(){return []};`,
  sliceIdentity: `const s=Array.prototype.slice;Array.prototype.slice=function(a,b){return s.call(this,a,b).reverse()};`,
  concat: `Array.prototype.concat=function(){return []};`,
  forEach: `Array.prototype.forEach=function(){};`,
  some: `Array.prototype.some=function(){return false};Array.prototype.every=function(){return true};`,
  find: `Array.prototype.find=function(){return undefined};Array.prototype.findIndex=function(){return -1};`,
  join: `Array.prototype.join=function(){return ''};`,
  indexOf: `Array.prototype.indexOf=function(){return -1};`,
  reduce: `Array.prototype.reduce=function(f,i){return i};`,
  sort: `Array.prototype.sort=function(){return this};`,
  objectEntries: `Object.entries=function(){return []};Object.values=function(){return []};`,
  objectHasOwn: `Object.prototype.hasOwnProperty=function(){return false};Object.hasOwn=function(){return false};`,
  mathRound: `Math.round=function(){return 0};`,
  mathMaxMin: `Math.max=function(){return NaN};Math.min=function(){return NaN};`,
  mathAbs: `Math.abs=function(){return 0};Math.pow=function(){return 0};`,
  parseFloat: `window.parseFloat=function(){return NaN};Number.parseFloat=window.parseFloat;`,
  stringSplit: `String.prototype.split=function(){return []};`,
  stringReplace: `String.prototype.replace=function(){return ''};String.prototype.replaceAll=function(){return ''};`,
  stringSlice: `String.prototype.slice=function(){return ''};String.prototype.substring=function(){return ''};`,
  stringIndexOf: `String.prototype.indexOf=function(){return -1};String.prototype.includes=function(){return false};`,
  stringToUpper: `String.prototype.toUpperCase=function(){return ''};`,
  regexpTest: `RegExp.prototype.test=function(){return false};`,
  regexpCtorThrows: `window.RegExp=function(){throw new Error('re')};`,
  nodeFilter: `window.NodeFilter={SHOW_ELEMENT:0,SHOW_TEXT:0,FILTER_ACCEPT:2,FILTER_SKIP:1,FILTER_REJECT:1};`,
  objectProtoGetterThrows: `Object.defineProperty(Object.prototype,'type',{get(){throw new Error('type')},set(v){Object.defineProperty(this,'type',{value:v,writable:true,enumerable:true,configurable:true})},configurable:true});`
};
(async () => {
  const b = await C.launch();
  let base;
  for (const [name, js] of Object.entries(cases)) {
    if (process.argv[2] && name !== 'clean' && !name.includes(process.argv[2])) continue;
    const p = await b.newPage();
    await p.setContent(`<!DOCTYPE html><html lang="en"><head><title>T</title><script>${js}</script></head><body>${BODY}</body></html>`);
    await p.evaluate(C.BUNDLE);
    const r = await p.evaluate(() => {
      try {
        const r = window.a11ycore.runa11yCoreInPage(null, null, {}, null);
        return { rules: r.checksResults.map((c) => [c.ruleId, c.outcome, c.occurrences.length, c.error ? String(c.error).slice(0, 100) : '']), warnings: (r.warnings || []).length, firstSummary: (r.checksResults.find((c) => c.ruleId === 'img-alt-present') || {}).outcome };
      } catch (e) { return { thrown: (e.code || 'uncoded') + ': ' + String(e.message).slice(0, 160) }; }
    });
    await p.close();
    if (name === 'clean') { base = new Map(r.rules.map((x) => [x[0], x.slice(1).join('/')])); console.log('clean rules', r.rules.length); continue; }
    if (r.thrown) { console.log(JSON.stringify({ name, thrown: r.thrown })); continue; }
    const changed = r.rules.filter((x) => base.get(x[0]) !== x.slice(1).join('/'));
    console.log(JSON.stringify({ name, rules: r.rules.length, changed: changed.length, errors: r.rules.filter((x) => x[3]).length, warnings: r.warnings, sample: changed.slice(0, 5).map((x) => x[0] + ' ' + base.get(x[0]) + ' -> ' + x.slice(1).join('/')) }));
  }
  await b.close();
})();
