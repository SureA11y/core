const {run4,setMsg}=require('./h.js');setMsg(400);
const W=(b)=>`<!doctype html><html lang=en><head><title>t</title><style>body{margin:8px;font:16px/1.5 sans-serif}</style></head><body><main>${b}</main></body></html>`;
const R=['resize-text-content-loss'];const V={width:640,height:800};
const T='Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
const cases=[
 ['card-second-para-hidden',`<div style="height:48px;overflow:hidden;width:300px"><h3 style="margin:0;font-size:16px;line-height:24px">Card title</h3><p style="margin:0">Excerpt text that is wholly cut</p></div>`],
 ['card-same-node',`<div style="height:48px;overflow:hidden;width:300px">Card title that is long enough to wrap onto more lines than fit in the card box here</div>`],
 ['contain-paint-wrap',`<div style="contain:paint;height:30px;width:200px">${T}</div>`],
 ['cv-auto-wrap',`<div style="content-visibility:auto;height:30px;width:200px">${T}</div>`],
 ['overflow-hidden-wrap',`<div style="overflow:hidden;height:30px;width:200px">${T}</div>`],
 ['nonmodal-dialog',`<div style="overflow:hidden;height:30px;width:200px">${T}</div><dialog open>Hi</dialog>`],
 ['modal-dialog',`<div style="overflow:hidden;height:30px;width:200px">${T}</div><dialog id=d>Hi<div style="overflow:hidden;height:30px;width:200px">${T}</div></dialog><script>d.showModal()</script>`],
 ['transform-scale',`<div style="height:30px;overflow:hidden;width:200px"><div style="transform:scale(0.9)">${T}</div></div>`],
 ['transform-on-box',`<div style="height:30px;overflow:hidden;width:200px;transform:translateX(0)">${T}</div>`],
 ['abs-child-escapes',`<div style="height:30px;overflow:hidden;width:200px"><div style="position:absolute">${T}</div></div>`],
 ['abs-child-relative-box',`<div style="position:relative;height:30px;overflow:hidden;width:200px"><div style="position:absolute;top:0">${T}</div></div>`],
 ['fixed-box-clip',`<div style="position:fixed;bottom:0;height:30px;overflow:hidden;width:200px">${T}</div>`],
 ['svg',`<div style="width:50px;overflow:hidden"><svg width=300 height=30><text x=0 y=20>SVG label text that is long</text></svg></div>`],
 ['shadow-clip',`<x-c></x-c><script>customElements.define('x-c',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div style="overflow:hidden;height:30px;width:200px">${T}</div>'}})</script>`],
 ['slotted-clip',`<x-s>${T}</x-s><script>customElements.define('x-s',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div style="overflow:hidden;height:30px;width:200px"><slot></slot></div>'}})</script>`],
 ['iframe-doc',`<iframe srcdoc='<div style="overflow:hidden;height:30px;width:200px">${T}</div>' width=300 height=100 title=f></iframe>`],
 ['animation-infinite-ticker',`<style>@keyframes t{from{transform:translateX(0)}to{transform:translateX(-100%)}}</style><div style="overflow:hidden;width:200px;white-space:nowrap"><div style="animation:t 10s linear infinite">${T}</div></div>`],
 ['line-clamp-std',`<p style="line-clamp:2;overflow:hidden;width:200px;display:-webkit-box;-webkit-box-orient:vertical">${T}</p>`],
 ['ellipsis-on-parent-of-span',`<div style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span>${T}</span></div>`],
 ['ellipsis-inline-block',`<div style="width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><span style="display:inline-block">${T}</span></div>`],
 ['wc-product-title',`<ul class="products"><li class="product" style="width:140px"><h2 class="woocommerce-loop-product__title" style="height:44px;overflow:hidden;font-size:16px">Organic cotton crew-neck T-shirt in midnight blue</h2></li></ul>`],
];
run4(cases.map(([n,b])=>({name:n,rules:R,html:W(b),viewport:V,base:'none',w:900})),{modes:['chrome']});
