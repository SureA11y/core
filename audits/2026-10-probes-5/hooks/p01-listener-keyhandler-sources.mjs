// Where can a key handler live that the early listener hook misses, so that
// click-handler-keyboard-operable fails CLICK_HANDLER_NO_KEY_LISTENER on a
// control that does work from the keyboard?
import { open, scan, show } from './h.mjs';
const R = ['click-handler-keyboard-operable', 'widget-keyboard-focusable'];
const btn = '<div id="b" role="button" tabindex="0">Save</div>';
const act = "function act(){document.title='done'}";
const cases = {
  baseline_noKey: `${btn}<script>${act};b.addEventListener('click',act)</script>`,
  ownKeydown: `${btn}<script>${act};b.addEventListener('click',act);b.addEventListener('keydown',e=>{if(e.key==='Enter')act()})</script>`,
  docKeydown: `${btn}<script>${act};b.addEventListener('click',act);document.addEventListener('keydown',e=>{if(e.target===b&&e.key==='Enter')act()})</script>`,
  // Lit-style component: key listener on the shadow root, button inside it.
  shadowRootKeydown: `<x-c id="h"></x-c><script>${act};customElements.define('x-c',class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:'open'});r.innerHTML='<div id=b role=button tabindex=0>Save</div>';const b=r.getElementById('b');b.addEventListener('click',act);r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')e.target.click()})}})</script>`,
  shadowRootKeydownClosed: `<x-d id="h"></x-d><script>${act};customElements.define('x-d',class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:'closed'});r.innerHTML='<div id=b role=button tabindex=0>Save</div>';const b=r.getElementById('b');b.addEventListener('click',act);r.addEventListener('keydown',e=>{if(e.key==='Enter')e.target.click()})}})</script>`,
  // Keydown attached on first focus (lazy wiring).
  keydownOnFocus: `${btn}<script>${act};b.addEventListener('click',act);b.addEventListener('focus',()=>b.addEventListener('keydown',e=>{if(e.key==='Enter')act()}),{once:true})</script>`,
  focusinDocLazy: `${btn}<script>${act};b.addEventListener('click',act);document.addEventListener('focusin',e=>{e.target.onkeydown=k=>{if(k.key==='Enter')e.target.click()}})</script>`,
  // listener added through another realm's addEventListener.
  otherRealmAdd: `${btn}<iframe id=f></iframe><script>${act};b.addEventListener('click',act);const add=f.contentWindow.EventTarget.prototype.addEventListener;add.call(b,'keydown',e=>{if(e.key==='Enter')act()})</script>`,
  // keydown on <html> element via attribute
  htmlAttr: `<html onkeydown="if(event.target.id==='b'&&event.key==='Enter')document.title='x'"><body>${btn}<script>${act};b.addEventListener('click',act)</script></body></html>`,
  // accesskey on the div: Chromium focuses and clicks it.
  accesskey: `<div id="b" role="button" tabindex="0" accesskey="s">Save</div><script>${act};b.addEventListener('click',act)</script>`,
  // window via property
  winOnkeydown: `${btn}<script>${act};b.addEventListener('click',act);window.onkeydown=e=>{if(e.target===b&&e.key==='Enter')act()}</script>`,
  // document onkeydown via setAttribute on body
  bodySetAttr: `${btn}<script>${act};b.addEventListener('click',act);document.body.setAttribute('onkeydown','')</script>`,
  // handleEvent object
  handleEventObj: `${btn}<script>${act};b.addEventListener('click',act);b.addEventListener('keyup',{handleEvent(e){if(e.key===' ')act()}})</script>`,
  // listener on element via onkeydown property with the setter grabbed before? (no: early)
  // key listener on the slot's ancestor in the host's shadow (slotted button)
  slotted: `<x-s><div id="b" role="button" tabindex="0">Save</div></x-s><script>${act};customElements.define('x-s',class extends HTMLElement{constructor(){super();const r=this.attachShadow({mode:'open'});r.innerHTML='<div><slot></slot></div>';r.addEventListener('keydown',e=>{if(e.key==='Enter')e.target.click()})}});b.addEventListener('click',act)</script>`,
  // pointerdown instead of click: not seen at all
  pointerdownOnly: `${btn}<script>${act};b.addEventListener('pointerdown',act)</script>`,
  // listener with an already aborted signal: never added
  abortedSignalClick: `<div id="b" role="button">Save</div><script>${act};const ac=new AbortController();ac.abort();b.addEventListener('click',act,{signal:ac.signal})</script>`,
  removedClick: `<div id="b" role="button">Save</div><script>${act};b.addEventListener('click',act);b.removeEventListener('click',act)</script>`,
  removedClickCaptureMismatch: `<div id="b" role="button">Save</div><script>${act};b.addEventListener('click',act,{capture:true});b.removeEventListener('click',act,true)</script>`,
  onceFired: `<div id="b" role="button">Save</div><script>${act};b.addEventListener('click',act,{once:true});b.click()</script>`,
  onclickNull: `<div id="b" role="button">Save</div><script>${act};b.onclick=act;b.onclick=null</script>`
};
const b = await open();
for (const [name, html] of Object.entries(cases)) {
  for (const hooks of [['listener'], []]) {
    const r = await scan(b, html, { hooks, runOnly: R });
    console.log(show(name + (hooks.length ? '' : ' (no hook)'), r, R.slice(0, 1)));
  }
}
await b.close();
