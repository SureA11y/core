const {four,close}=require('./h.js');
const P=(t,body='<h1>x</h1>',head='')=>`<!doctype html><html lang=en><head><meta charset=utf-8><title>${t}</title>${head}</head><body><main>${body}</main></body></html>`;
const cases=[
 ['title Sample page as a topic', P('How to design a sample page for your landing site – Acme')],
 ['title Sample Pages product', P('Sample Page Templates – Free Download | Acme')],
 ['title with percents', P('Save 20%% on shoes – Acme')],
 ['title with %%%', P('100%%% cotton shirts – Acme')],
 ['title %%currentyear%% kept', P('Best laptops %%currentyear%% – Acme')],
 ['title Página de ejemplo', P('Página de ejemplo – Mi tienda')],
];
const mq=(s,body)=>`<!doctype html><html lang=en><head><title>Marquee test</title></head><body><main><h1>h</h1>${body}<script>${s}</script></main></body></html>`;
const cases2=[
 ['marquee hover + keyboard focus stop on load', mq(`window.addEventListener('load',()=>{const m=document.getElementById('m');m.addEventListener('mouseenter',()=>m.stop());m.addEventListener('mouseleave',()=>m.start());m.addEventListener('focusin',()=>m.stop());});`,`<marquee id=m tabindex=0>News</marquee>`)],
 ['marquee hover on load + pause button', mq(`window.addEventListener('load',()=>{const m=document.getElementById('m');m.addEventListener('mouseover',()=>m.stop());m.addEventListener('mouseout',()=>m.start());document.getElementById('p').addEventListener('click',()=>m.stop());});`,`<marquee id=m>News</marquee><button id=p>Pause</button>`)],
 ['marquee jQuery-like hover stub, plus click', mq(`window.$=function(s){const e=document.querySelector(s);return {hover(a,b){e.addEventListener('mouseenter',a);e.addEventListener('mouseleave',b);return this},on(t,f){e.addEventListener(t,f);return this}}};$('#m').hover(function(){this.stop()},function(){this.start()}).on('click',function(){this.stop()});`,`<marquee id=m>News</marquee>`)],
];
(async()=>{for(const [l,h] of cases)await four(l,h,['page-title-patterns']);for(const [l,h] of cases2)await four(l,h,['deprecated-elements-not-used']);await close();})();
