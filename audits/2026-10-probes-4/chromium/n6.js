const {run,rep}=require('./nh.js');const {close}=require('./h.js');
const IGN=['manual-review','page-title-patterns','contrast-computable','contrast-minimum','target-size-minimum','form-control-programmatic-label-quality'];
const $=s=>`document.querySelector(${JSON.stringify(s)})`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>R</title><style>x-icon-btn{display:inline-block;width:32px;height:32px;background:#06c;margin:8px}</style></head><body style="background:#fff"><main><h1>R</h1>
 <x-icon-btn id=a role=button tabindex=0></x-icon-btn>
 <x-icon-btn id=b role=link tabindex=0></x-icon-btn>
 <x-icon-btn id=c role=img></x-icon-btn>
 <x-icon-btn id=d role=textbox tabindex=0></x-icon-btn>
 <x-icon-btn id=e role=button tabindex=0><span class=icon aria-hidden=true></span></x-icon-btn>
 </main><script>
 customElements.define('x-icon-btn',class extends HTMLElement{constructor(){super();this.i=this.attachInternals();this.i.ariaLabel='Label '+this.id;}});
 </script></body></html>`;
 const r=await run(html,{a:$('#a'),b:$('#b'),c:$('#c'),d:$('#d'),e:$('#e')},{ignore:IGN});
 console.log(rep('sized custom elements named only by ElementInternals.ariaLabel',r));
 await close();})();
