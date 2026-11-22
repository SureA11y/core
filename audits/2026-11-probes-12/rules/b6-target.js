const {run4,setMsg}=require('./h.js');setMsg(120);
const W=(b,extra='')=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.5 sans-serif} .s{display:inline-block;width:16px;height:16px;padding:0;border:0;margin:0}</style></head><body>${extra}<main>${b}</main></body></html>`;
const R=['target-size-minimum'];
const sh=(host,inner)=>`<script>customElements.define('${host}',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}})</script>`;
const cases=[
 ['stars-role-radio','<div role=radiogroup aria-label=Rating><span class=s role=radio aria-checked=false tabindex=0>★</span><span class=s role=radio aria-checked=false tabindex=-1>★</span><span class=s role=radio tabindex=-1>★</span></div>'],
 ['tabs-small','<div role=tablist><span class=s role=tab tabindex=0>A</span><span class=s role=tab>B</span></div>'],
 ['role-token-fallback','<span class=s role="tooltip button">x</span><span class=s role="button">y</span>'],
 ['role-token-unknown-first','<span class=s role="foo checkbox">x</span><span class=s role="checkbox">y</span>'],
 ['role-uppercase','<span class=s role="CHECKBOX">x</span><span class=s role="Switch">y</span>'],
 ['gridcell-no-tabindex','<table role=grid><tr><td role=gridcell class=s>1</td><td role=gridcell class=s>2</td></tr></table>'],
 ['gridcell-tabindex','<table role=grid><tr><td role=gridcell class=s tabindex=0>1</td><td role=gridcell class=s tabindex=-1>2</td></tr></table>'],
 ['td-in-grid-native','<table role=grid><tr><td class=s tabindex=0>1</td><td class=s tabindex=-1>2</td></tr></table>'],
 ['option-listbox','<div role=listbox aria-label=x><div role=option style="height:16px">One</div><div role=option style="height:16px">Two</div></div>'],
 ['option-native-select','<select size=3 style="font-size:10px"><option>a</option><option>b</option><option>c</option></select>'],
 ['textbox-role','<div role=textbox contenteditable style="height:16px;width:200px"></div><div role=textbox contenteditable style="height:16px;width:200px"></div>'],
 ['slider-thumbs','<div style="position:relative;height:30px;width:200px"><span role=slider class=s tabindex=0 aria-valuenow=1 style="position:absolute;left:10px"></span><span role=slider class=s tabindex=0 aria-valuenow=2 style="position:absolute;left:30px"></span></div>'],
 ['scrollbar-role','<div role=scrollbar class=s aria-controls=x aria-valuenow=0></div><div role=scrollbar class=s aria-controls=x aria-valuenow=0></div>'],
 ['treeitem','<ul role=tree><li role=treeitem style="height:16px;font-size:12px">a</li><li role=treeitem style="height:16px;font-size:12px">b</li></ul>'],
 ['menuitem-hidden-menu','<ul role=menu style="display:none"><li role=menuitem class=s>a</li><li role=menuitem class=s>b</li></ul>'],
 ['custom-el-internals','<x-cb></x-cb><x-cb></x-cb><script>customElements.define("x-cb",class extends HTMLElement{constructor(){super();const i=this.attachInternals();i.role="checkbox";this.style.cssText="display:inline-block;width:16px;height:16px";}})</script>'],
 ['shadow-icons','<x-bar></x-bar>'+sh('x-bar','<button style="width:16px;height:16px;padding:0;border:0">a</button><button style="width:16px;height:16px;padding:0;border:0">b</button>')],
 ['shadow-slotted','<x-bar2><button style="width:16px;height:16px;padding:0;border:0">a</button><button style="width:16px;height:16px;padding:0;border:0">b</button></x-bar2>'+sh('x-bar2','<div style="display:flex"><slot></slot></div>')],
 ['woo-qty','<div class="quantity"><button class=s aria-label=minus>-</button><input type=number value=1 style="width:40px;height:16px;padding:0;border:1px solid"><button class=s aria-label=plus>+</button></div>'],
 ['wp-social','<ul class="wp-block-social-links" style="display:flex;gap:4px;list-style:none;padding:0"><li><a href=# class=s aria-label=fb>f</a></li><li><a href=# class=s aria-label=tw>t</a></li></ul>'],
 ['cookie-banner-fixed-small-over-page',`<div style="height:2000px"><p>${'<a href=# class=s>x</a> '.repeat(1)}</p>`.replace('<p>','<p style="margin-top:780px">')+'</div><div style="position:fixed;bottom:0;left:8px"><button class=s>x</button></div>'],
 ['fixed-small-pair','<div style="height:2000px"></div><div style="position:fixed;bottom:0;left:8px"><button class=s>a</button><button class=s>b</button></div>'],
 ['sticky-header','<header style="position:sticky;top:0;background:#fff"><a href=# class=s>a</a></header><div style="height:3000px"><a href=# class=s style="margin-top:4px">b</a></div>'],
 ['overlay-backdrop','<button class=s>a</button><button class=s style="margin-left:30px">b</button><div style="position:fixed;inset:0;background:rgba(0,0,0,.3)"></div>'],
 ['below-fold-pair','<div style="height:3000px"></div><button class=s>a</button><button class=s>b</button>'],
 ['rtl-pair','<div dir=rtl><button class=s>a</button><button class=s>b</button></div>'],
 ['vertical-pair','<div style="writing-mode:vertical-rl"><button class=s>a</button><button class=s>b</button></div>'],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b)})),{modes:['chrome']});
