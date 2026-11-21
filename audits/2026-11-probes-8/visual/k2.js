// contrast: fallback content of an empty <slot> in an open shadow root is drawn but never measured
const { cases, close } = require('./multi');
const { shot } = require('./h');
const mk = (inner) => `<x-a></x-a><script>customElements.define('x-a',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)}}})</script>`;
(async () => {
 const L = [
  ['slot fallback text', mk('<slot style="color:#ccc">Fallback text</slot>')],
  ['slot fallback in span', mk('<slot><span style="color:#ccc">Fallback span</span></slot>')],
  ['p in shadow (control)', mk('<p style="color:#ccc">Shadow paragraph</p>')],
  ['slot fallback link small', mk('<p>Text <slot><a href="#" style="color:#333;text-decoration:none">fallback link</a></slot> more text</p>')],
 ];
 await cases(L, ['contrast-minimum','contrast-computable','link-in-text-block']);
 const s = await shot(L[0][1], { sample: [[0,0]], eval: () => { const sr = document.querySelector('x-a').shadowRoot; const r = document.createRange(); r.selectNodeContents(sr.querySelector('slot')); const b = r.getBoundingClientRect(); return [b.width, b.height, getComputedStyle(sr.querySelector('slot')).color]; } });
 console.log('slot fallback drawn box:', s.ev);
 await close();
})();
