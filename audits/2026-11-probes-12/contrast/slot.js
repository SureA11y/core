const { cr, js, rule, brief, page, close } = require('./h.js');
const ids=['contrast-minimum'];
const h=(inner)=>page(`<x-s>Buy now</x-s><script>customElements.define('x-s',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML='${inner}'}})</script>`);
(async()=>{
 for (const [l,x] of [
  ['slot in grey div', h('<div style="color:#aaa"><slot></slot></div>')],
  ['slot with grey style on slot', h('<slot style="color:#aaa"></slot>')],
  ['::slotted grey', h('<style>::slotted(*){color:#aaa}</style><div style="color:#aaa"><slot></slot></div>')],
  [':host grey', h('<style>:host{color:#aaa}</style><slot></slot>')],
 ]) for (const root of ['r8','main','br']) { const r=await cr(root,x,ids); console.log(l.padEnd(30), root, brief(rule(r,'contrast-minimum'))); }
 await close();
})();
