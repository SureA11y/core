// Late hook, a page that replaces addEventListener, frames, and two scans in a row.
import { open, scan, show, HOOKS } from './h.mjs';
const R = ['click-handler-keyboard-operable'];
const btn = `<div id="b" role="button" tabindex="0">Save</div><script>b.addEventListener('click',()=>{})</script>`;
const cases = {
  early: [btn, { hooks: ['listener'] }],
  late: [btn, { lateHooks: ['listener'] }],
  lateThenAdd: [`<div id="b" role="button" tabindex="0">Save</div>`, { lateHooks: ['listener'], before: null, after: true }],
  zoneLikePatch: [`<script>const o=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(t,l,op){return o.call(this,t,l,op)}</script>` + btn, { hooks: ['listener'] }],
  patchElementProto: [`<script>const o=EventTarget.prototype.addEventListener;Element.prototype.addEventListener=function(t,l,op){return o.call(this,t,l,op)}</script>` + btn, { hooks: ['listener'] }],
  twiceInstalled: [btn, { hooks: ['listener', 'listener'] }],
  // a page that installs a fake registry before the hook: hook should bail and engine ignore
  forgedRegistry: [btn, { initScript: `Object.defineProperty(window, Symbol.for('surea11y.listeners'), {value: {version:1, early:true, map:new WeakMap()}})`, hooks: ['listener'] }],
  // iframe: content with a click listener and no key listener, scanned from top
  iframeContent: [`<iframe id=f srcdoc='<div id=b role=button tabindex=0>Save</div><script>b.addEventListener("click",()=>{});</script>'></iframe>`, { hooks: ['listener'], wait: true }],
  // element moved into the document from a template/other doc
  adoptedFromTemplate: [`<template id=t><div role=button tabindex=0>Save</div></template><script>const n=t.content.firstElementChild;n.addEventListener('click',()=>{});document.body.append(document.adoptNode(n))</script>`, { hooks: ['listener'] }],
  // String object type for the key listener
  stringObjKeyType: [`<div id="b" role="button" tabindex="0">Save</div><script>b.addEventListener('click',()=>{});b.addEventListener(new String('keydown'),e=>{})</script>`, { hooks: ['listener'] }]
};
const b = await open();
for (const [name, [html, o]] of Object.entries(cases)) {
  const opts = { runOnly: R, ...o };
  if (o.wait) opts.before = (p) => p.waitForTimeout(200);
  if (o.after) opts.before = null;
  const r = await scan(b, html, opts);
  console.log(show(name, r, R).replace(/\n/g, ' |'));
}
// Determinism: same page scanned twice in one load, and two loads.
const { serve } = await import('./h.mjs');
const ctx = await b.newContext();
const page = await ctx.newPage();
await page.addInitScript({ content: HOOKS.listener });
await page.goto(serve(btn + `<div id=c role=button>x</div><script>c.onclick=()=>{}</script>`));
const fs = await import('node:fs');
await page.addScriptTag({ content: fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8') });
const outs = [];
for (let i = 0; i < 3; i++) {
  outs.push(await page.evaluate(async () => {
    const r = await window.a11ycore.runa11yCoreInPageAsync(location.href, null, {}, ['click-handler-keyboard-operable', 'widget-keyboard-focusable']);
    return JSON.stringify(r.checksResults.map((c) => [c.ruleId, c.outcome, (c.occurrences || []).map((o) => o.data?.details?.reasonCode)]));
  }));
}
console.log('determinism same page x3:', new Set(outs).size === 1 ? 'stable' : 'DIFFERENT', outs[0]);
await ctx.close();
await b.close();
