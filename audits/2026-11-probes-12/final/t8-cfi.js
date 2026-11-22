const {four,page,close}=require('./h.js');
const sh=(tpl)=>`<script>customElements.define('x-w',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(tpl)}}});</script>`;
const cases=[
 ['doc ::part(btn):focus outline none', `<style>x-w::part(btn):focus{outline:none}</style>`+sh('<button part=btn>Go</button>')+`<x-w></x-w>`],
 ['doc sheet, slotted light button', `<style>button:focus{outline:none}</style>`+sh('<slot></slot>')+`<x-w><button>Slotted</button></x-w>`],
 ['shadow ::slotted(button):focus none', sh('<style>::slotted(button:focus){outline:none}</style><slot></slot>')+`<x-w><button>Slotted</button></x-w>`],
 ['shadow :host(:focus) outline none, host tabindex', sh('<style>:host(:focus){outline:none}</style><span>t</span>')+`<x-w tabindex=0></x-w>`],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['css-focus-indicator-suppressed']);await close();})();
