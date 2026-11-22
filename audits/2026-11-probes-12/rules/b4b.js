const {run4,setMsg}=require('./h.js');setMsg(150);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title></head><body><main>${b}</main></body></html>`;
const PC=['aria-prohibited-children','aria-required-children','aria-required-parent','listitem-parent-valid'];
const FG=['form-group-name-present'];
const sh=(host,inner)=>`<script>customElements.define('${host}',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}})</script>`;
const cases=[
 ['pc-shadow-tab',PC,'<x-tabs role=tablist></x-tabs>'+sh('x-tabs','<div role=tab>A</div><div role=tab>B</div>')],
 ['rc-empty-tablist-shadow',PC,'<x-tl2 role=tablist></x-tl2>'+sh('x-tl2','<div>x</div>')],
 ['pc-shadow-wrapper-button',PC,'<x-tl3 role=tablist></x-tl3>'+sh('x-tl3','<div><div role=tab>A</div><div role=button tabindex=0>+</div></div>')],
 ['pc-slot-fallback',PC,'<x-tl4 role=tablist><div role=tab>A</div></x-tl4>'+sh('x-tl4','<slot><div role=button>fallback</div></slot>')],
 ['li-shadow-ul-role-nav',PC,'<x-nav><li>a</li></x-nav>'+sh('x-nav','<ul role=navigation><slot></slot></ul>')],
 ['fg-shadow-fieldset',FG,'<x-fs><input slot=o type=radio name=s aria-label=a><input slot=o type=radio name=s aria-label=b></x-fs>'+sh('x-fs','<fieldset><legend>Size</legend><slot name=o></slot></fieldset>')],
 ['fg-shadow-unslotted',FG,'<x-fs2><input type=radio name=s aria-label=a><input slot=o type=radio name=s aria-label=b><input slot=o type=radio name=s aria-label=c></x-fs2>'+sh('x-fs2','<div><slot name=o></slot></div>')],
 ['fg-shadow-radios-inside',FG,'<x-rg></x-rg>'+sh('x-rg','<input type=radio name=s aria-label=a><input type=radio name=s aria-label=b>')],
 ['fg-shadow-radios-in-light-fieldset',FG,'<fieldset><legend>Size</legend><x-rg2></x-rg2></fieldset>'+sh('x-rg2','<input type=radio name=s aria-label=a><input type=radio name=s aria-label=b>')],
 ['fg-shadow-two-hosts-same-name',FG,'<x-r1></x-r1><x-r1></x-r1>'+sh('x-r1','<input type=radio name=s aria-label=a>')],
 ['fg-hidden-legend',FG,'<fieldset><legend hidden>Size</legend><input type=radio name=s aria-label=a><input type=radio name=s aria-label=b></fieldset>'],
 ['fg-legend-img',FG,'<fieldset><legend><img src=x.png alt="Size"></legend><input type=radio name=s aria-label=a><input type=radio name=s aria-label=b></fieldset>'],
 ['fg-aria-hidden-ancestor',FG,'<div aria-hidden=true><input type=radio name=s aria-label=a tabindex=-1><input type=radio name=s aria-label=b tabindex=-1></div>'],
 ['fg-aria-hidden-but-focusable',FG,'<div aria-hidden=true><input type=radio name=s aria-label=a><input type=radio name=s aria-label=b></div>'],
 ['fg-inert',FG,'<div inert><input type=radio name=s aria-label=a><input type=radio name=s aria-label=b></div>'],
];
run4(cases.map(([n,r,b])=>({name:n,rules:r,html:W(b),base:r===FG?'none':'r8'})));
