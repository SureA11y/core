const {run4,setMsg}=require('./h.js');setMsg(160);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.2 sans-serif}</style></head><body><main>${b}</main></body></html>`;
const R=['text-spacing-content-loss'];
const T='Free shipping on all orders over fifty dollars';
const sh=(host,inner)=>`<script>customElements.define('${host}',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML=${JSON.stringify(inner)};}})</script>`;
const cases=[
 ['btn-fixed',`<button style="height:20px;width:120px;overflow:hidden">${T}</button>`],
 ['tight-box',`<div style="height:40px;width:300px;overflow:hidden">${T} ${T}</div>`],
 ['clip-path',`<div style="height:40px;width:300px;clip-path:inset(0)">${T} ${T}</div>`],
 ['clamp-2',`<p style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;width:300px">${T} ${T} ${T}</p>`],
 ['shadow-box',`<x-t></x-t>`+sh('x-t',`<div style="height:40px;width:300px;overflow:hidden">${T} ${T}</div>`)],
 ['slotted',`<x-u>${T} ${T}</x-u>`+sh('x-u','<div style="height:40px;width:300px;overflow:hidden"><slot></slot></div>')],
 ['vertical',`<div lang=ja style="writing-mode:vertical-rl;height:120px;width:60px;overflow:hidden">日本語の長いテキストが入ります日本語の長いテキスト</div>`],
 ['rtl',`<div dir=rtl lang=ar style="height:40px;width:200px;overflow:hidden">نص طويل جدا هنا يتجاوز حدود الصندوق بسهولة</div>`],
 ['input',`<input value="${T}" style="width:200px">`],
 ['nav-nowrap',`<nav><a href=# style="display:inline-block;width:110px;white-space:nowrap;overflow:hidden">Products & services</a></nav>`],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b)})),{modes:['chrome']});
