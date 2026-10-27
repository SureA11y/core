const {run,rep}=require('./nh.js');const {close}=require('./h.js');
const IGN=['manual-review','page-title-patterns','contrast-computable','contrast-minimum','target-size-minimum','form-control-programmatic-label-quality'];
const $=s=>`document.querySelector(${JSON.stringify(s)})`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>R</title></head><body style="background:#fff"><main><h1>R</h1>
 <x-c id=cb role=checkbox tabindex=0>Subscribe</x-c>
 <x-c id=hd role=heading>Section title</x-c>
 <x-c id=sl role=slider tabindex=0 aria-label="Volume"></x-c>
 <input id=ad role=combobox aria-label="City" aria-expanded=false><ul id=lb role=listbox><li role=option id=o1>Paris</li></ul>
 </main><script>
 customElements.define('x-c',class extends HTMLElement{constructor(){super();this.i=this.attachInternals();}connectedCallback(){if(this.id==='cb')this.i.ariaChecked='false';if(this.id==='hd')this.i.ariaLevel='2';if(this.id==='sl'){this.i.ariaValueNow='5';this.i.ariaValueMin='0';this.i.ariaValueMax='10';}}});
 document.getElementById('ad').ariaControlsElements=[document.getElementById('lb')];
 document.getElementById('ad').ariaActiveDescendantElement=document.getElementById('o1');
 </script></body></html>`;
 const r=await run(html,{cb:$('#cb'),hd:$('#hd'),sl:$('#sl'),ad:$('#ad')},{ignore:IGN});
 console.log(rep('internals states / reflected refs',r));
 // what Chromium says about checked/level via full node
 await close();})();
