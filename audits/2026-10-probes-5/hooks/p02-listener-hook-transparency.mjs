// Does installing the listener hook change what the page sees?
// Runs the same probes with and without the hook and diffs the results.
import { open, HOOKS, serve } from './h.mjs';
const probe = `(() => {
  const out = {};
  const T = EventTarget.prototype;
  const d = document.createElement('div');
  const f = () => {};
  out.addReturn = String(d.addEventListener('click', f));
  out.removeReturn = String(d.removeEventListener('click', f));
  out.addName = T.addEventListener.name + '/' + T.addEventListener.length;
  out.addDesc = JSON.stringify(Object.getOwnPropertyDescriptor(T, 'addEventListener'), (k, v) => typeof v === 'function' ? 'fn' : v);
  out.isNative = /\\[native code\\]/.test(Function.prototype.toString.call(T.addEventListener));
  out.hasProtoProp = 'prototype' in T.addEventListener;
  try { new T.addEventListener('x', f); out.construct = 'no throw'; } catch (e) { out.construct = e.constructor.name; }
  // capture getter calls
  let n = 0; const opts = { get capture() { n++; return false; } };
  d.addEventListener('keydown', f, opts); out.captureGetterReads = n;
  n = 0; d.removeEventListener('keydown', f, opts); out.captureGetterReadsRemove = n;
  // bad this
  try { T.addEventListener.call({}, 'click', f); out.badThis = 'no throw'; } catch (e) { out.badThis = e.constructor.name + ':' + e.message; }
  // undefined this (strict caller)
  try { (function(){ 'use strict'; return T.addEventListener.call(undefined, 'keydown', f); })(); out.undefThis = 'ok'; } catch (e) { out.undefThis = e.constructor.name + ':' + e.message; }
  // missing listener / bad args
  try { d.addEventListener('click'); out.missingListener = 'no throw'; } catch (e) { out.missingListener = e.constructor.name + ':' + e.message; }
  try { d.addEventListener(); out.noArgs = 'no throw'; } catch (e) { out.noArgs = e.constructor.name + ':' + e.message.replace(/\\s+/g,' '); }
  // Symbol type: native converts to string -> TypeError
  try { d.addEventListener(Symbol('x'), f); out.symbolType = 'no throw'; } catch (e) { out.symbolType = e.constructor.name; }
  // type object with toString: native stringifies; does the hook record it?
  const typeObj = { toString() { return 'click'; } };
  d.addEventListener(typeObj, f);
  const reg = window[Symbol.for('surea11y.listeners')];
  out.typeObjRecorded = reg ? !!reg.map.get(d) && !!reg.map.get(d).get('click') : 'nohook';
  // String object type 'keydown'
  const e2 = document.createElement('div');
  e2.addEventListener(new String('keydown'), f);
  out.stringObjRecorded = reg ? !!(reg.map.get(e2) && reg.map.get(e2).get('keydown')) : 'nohook';
  // uppercase type: DOM types are case-sensitive, 'Click' is a different event
  const e3 = document.createElement('div');
  e3.addEventListener('Click', f);
  out.upperRecorded = reg ? !!reg.map.get(e3) : 'nohook';
  // onclick property: setter/getter round trip, stringy value
  const e4 = document.createElement('div');
  e4.onclick = 'alert(1)'; out.onclickString = String(e4.onclick);
  e4.onclick = f; out.onclickFn = e4.onclick === f;
  const pd = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'onclick');
  out.onclickDesc = [typeof pd.get, typeof pd.set, pd.enumerable, pd.configurable, pd.set.name, pd.set.length].join(',');
  out.setterNative = /\\[native code\\]/.test(Function.prototype.toString.call(pd.set));
  // window.onkeydown own descriptor
  const wd = Object.getOwnPropertyDescriptor(window, 'onkeydown');
  out.winOnkeydownDesc = wd ? [typeof wd.get, typeof wd.set, wd.enumerable, wd.configurable].join(',') : 'none';
  // exception inside a listener still reported, and the listener this value
  let thisOk = false; d.addEventListener('click', function () { thisOk = this === d; }); d.click(); out.listenerThis = thisOk;
  // freezing the prototype after the hook
  try { Object.freeze(EventTarget.prototype); out.freeze = 'ok'; } catch (e) { out.freeze = String(e); }
  const e5 = document.createElement('div'); let fired = 0; e5.addEventListener('click', () => fired++); e5.click(); out.afterFreeze = fired;
  // Error stack frames
  try { d.addEventListener('click', f, { get signal() { throw new Error('sig'); } }); } catch (e) { out.throwFromOptions = e.message; }
  return out;
})()`;
const b = await open();
const results = {};
for (const hook of [false, true]) {
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  if (hook) await page.addInitScript({ content: HOOKS.listener });
  await page.goto(serve('<p>x</p>'));
  results[hook ? 'hook' : 'none'] = await page.evaluate(probe);
  await ctx.close();
}
for (const k of Object.keys(results.none)) {
  const a = results.none[k], c = results.hook[k];
  console.log((a === c ? '   ' : 'DIF'), k.padEnd(26), JSON.stringify(a), a === c ? '' : '=> ' + JSON.stringify(c));
}
for (const k of Object.keys(results.hook)) if (!(k in results.none)) console.log('ONLY-HOOK', k, results.hook[k]);
await b.close();
