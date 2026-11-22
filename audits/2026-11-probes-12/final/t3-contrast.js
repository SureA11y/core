const {four,page,close}=require('./h.js');
const sh=(tpl)=>`<script>customElements.define('x-c',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(tpl)}}});</script>`;
const cases=[
 // C12-3 overflow clipping variants
 ['clip: text half visible in overflow:hidden 10px box', `<div style="height:10px;overflow:hidden;line-height:20px;color:#bbb;background:#fff">Half shown grey text</div>`],
 ['clip: overflow-x hidden only, text below box', `<div style="height:10px;overflow-x:hidden;color:#bbb">Grey text spilling down</div>`],
 ['clip: overflow:clip, text outside', `<div style="height:0;overflow:clip"><span style="color:#bbb">Grey hidden</span></div><p>x</p>`],
 ['clip: abs child of non-positioned overflow box (not clipped)', `<div style="position:relative"><div style="height:0;overflow:hidden"><span style="position:absolute;top:0;color:#bbb">Grey shown</span></div></div>`],
 ['clip: fixed child inside overflow hidden (not clipped)', `<div style="height:0;overflow:hidden"><span style="position:fixed;top:50px;left:0;color:#bbb">Grey fixed shown</span></div>`],
 ['clip: woo star-rating', `<style>.star-rating{overflow:hidden;position:relative;height:1em;line-height:1;width:5.4em;font-size:1em}.star-rating::before{content:"SSSSS";color:#d3ced2;float:left;top:0;left:0;position:absolute}.star-rating span{overflow:hidden;float:left;top:0;left:0;position:absolute;padding-top:1.5em}.star-rating span::before{content:"SSSSS";top:0;position:absolute;left:0;color:#a46497}</style><div class=star-rating role=img aria-label="Rated 4 out of 5"><span style="width:80%">Rated <strong class=rating>4</strong> out of 5</span></div>`],
 // C12-2 slots
 ['slot: text in host, slot grey', sh('<slot style="color:#bbb"></slot>')+`<x-c>Slotted grey text</x-c>`],
 ['slot: text in host, no slot (not rendered)', sh('<p>Shadow only</p>')+`<x-c style="color:#bbb">Unrendered grey</x-c>`],
 ['slot: element slotted, ::slotted grey', sh('<style>::slotted(span){color:#bbb}</style><slot></slot>')+`<x-c><span>Slotted span</span></x-c>`],
 ['slot: text, slot inside dark bg div', sh('<div style="background:#000"><slot style="color:#333"></slot></div>')+`<x-c>Dark on black</x-c>`],
 // C12-10
 ['aria-disabled host role=button, grey shadow text', sh('<span style="color:#bbb">Disabled label</span>')+`<x-c role=button aria-disabled=true tabindex=0></x-c>`],
 ['aria-disabled host div (no role), grey shadow text', sh('<span style="color:#bbb">Not a control</span>')+`<x-c aria-disabled=true></x-c>`],
 // C12-14 revert
 ['revert: a href color:revert', `<style>a{color:#fff}a.r{color:revert}</style><p>Text <a class=r href=#>link</a> more</p>`],
 ['revert: span in link color:revert', `<style>a{color:#bbb}span.r{color:revert}</style><p>Text <a href=#><span class=r>link</span></a> more</p>`],
 ['revert: a without href color:revert', `<style>a{color:#bbb}a.r{color:revert}</style><p style="color:#000">Text <a class=r>anchor</a> more</p>`],
 ['revert: all:revert on link', `<style>a{color:#bbb}a.r{all:revert}</style><p>Text <a class=r href=#>link</a> more</p>`],
 ['revert-layer on link', `<style>@layer base{a{color:#000}} a.r{color:revert-layer}</style><p>Text <a class=r href=#>link</a> more</p>`],
 // C12-18 ::before overlay
 ['before overlay dark, white text', `<style>.h{position:relative;color:#fff}.h::before{content:"";position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>White on overlay</div>`],
 ['before overlay transparent (no paint)', `<style>.h{position:relative;color:#eee}.h::before{content:"";position:absolute;inset:0;z-index:-1}</style><div class=h>Light on white</div>`],
 ['before display:none', `<style>.h{position:relative;color:#eee}.h::before{content:"";display:none;position:absolute;inset:0;background:#000;z-index:-1}</style><div class=h>Light on white</div>`],
];
(async()=>{for(const [l,b] of cases)await four(l,page(b),['contrast-minimum']);await close();})();
