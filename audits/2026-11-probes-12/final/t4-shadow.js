const {four,page,close}=require('./h.js');
const sh=(tpl)=>`<script>customElements.define('x-c',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(tpl)}}});</script>`;
const cases=[
 ['slot: text in host, slot grey', sh('<slot style="color:#bbb"></slot>')+`<x-c>Slotted grey text</x-c>`],
 ['slot: text in host, no slot (not rendered)', sh('<p>Shadow only</p>')+`<x-c style="color:#bbb">Unrendered grey</x-c>`],
 ['slot: element slotted, ::slotted grey', sh('<style>::slotted(span){color:#bbb}</style><slot></slot>')+`<x-c><span>Slotted span</span></x-c>`],
 ['slot: text, slot inside dark bg div', sh('<div style="background:#000"><slot style="color:#333"></slot></div>')+`<x-c>Dark on black</x-c>`],
 ['slot: text, named slot only (default text unassigned)', sh('<slot name=a style="color:#000"></slot>')+`<x-c style="color:#bbb">Unassigned grey<b slot=a>Bold</b></x-c>`],
 ['slot: text, slot fallback grey but text assigned', sh('<slot style="color:#000"><span style="color:#bbb">fallback</span></slot>')+`<x-c>Assigned text</x-c>`],
 ['slot: host opacity via slot .3', sh('<slot style="opacity:.3"></slot>')+`<x-c>Faded slotted text</x-c>`],
 ['aria-disabled host role=button, grey shadow text', sh('<span style="color:#bbb">Disabled label</span>')+`<x-c role=button aria-disabled=true tabindex=0></x-c>`],
 ['aria-disabled host div (no role), grey shadow text', sh('<span style="color:#bbb">Not a control</span>')+`<x-c aria-disabled=true></x-c>`],
 ['aria-disabled outer div with role=group, host button', sh('<button style="color:#bbb">Inner</button>')+`<div role=group aria-disabled=true><x-c></x-c></div>`],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['contrast-minimum','contrast-computable']);await close();})();
