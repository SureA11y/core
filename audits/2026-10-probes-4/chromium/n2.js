const {run,rep}=require('./nh.js');const {close}=require('./h.js');
const IGN=['manual-review','page-title-patterns','contrast-computable','contrast-minimum','target-size-minimum','form-control-programmatic-label-quality'];
const $=s=>`document.querySelector(${JSON.stringify(s)})`;
(async()=>{
 const html=`<!doctype html><html lang=en><head><title>CE</title><style>body{background:#fff;color:#000}</style></head><body><main><h1>CE</h1>
 <x-btn id=xb1 role=button tabindex=0></x-btn>
 <x-btn id=xb2 tabindex=0></x-btn>
 <x-link id=xl role=link tabindex=0></x-link>
 <x-img id=ximg role=img></x-img>
 <x-field id=xf role=textbox tabindex=0></x-field>
 <span id=lbl>Email address</span><input id=refl>
 <span id=dsc>desc</span><button id=reflbtn></button>
 <x-shadowlabel id=xsl></x-shadowlabel>
 <x-dsd id=dsd1><template shadowrootmode=open><button id=inner><slot></slot></button></template>Save draft</x-dsd>
 <x-dsd id=dsd2><template shadowrootmode=open><button id=inner2><slot>Default name</slot></button></template></x-dsd>
 <x-dsd id=dsd3><template shadowrootmode=open><a href="#q" id=innerlink><slot name=t></slot></a></template><span slot=t>Docs</span></x-dsd>
 <x-dsd id=dsd4><template shadowrootmode=open><label for=ii>Name</label><input id=ii></template></x-dsd>
 <x-dsd id=dsd5><template shadowrootmode=open><slot></slot></template><input id=lightinp aria-label="Light"></x-dsd>
 <form-ce id=fce></form-ce><label for=fce>Rating</label>
 </main>
 <script>
 class XBtn extends HTMLElement{constructor(){super();this.i=this.attachInternals();}connectedCallback(){ if(this.id==='xb1'){this.i.ariaLabel='Save';} if(this.id==='xb2'){this.i.role='button';this.i.ariaLabel='Delete';} if(this.id==='xl'){this.i.ariaLabel='Home';} if(this.id==='ximg'){this.i.ariaLabel='Logo';} if(this.id==='xf'){this.i.ariaLabel='Search terms';}}}
 customElements.define('x-btn',XBtn);
 customElements.define('x-link',class extends XBtn{});customElements.define('x-img',class extends XBtn{});customElements.define('x-field',class extends XBtn{});
 document.getElementById('refl').ariaLabelledByElements=[document.getElementById('lbl')];
 document.getElementById('reflbtn').ariaLabelledByElements=[document.getElementById('lbl')];
 customElements.define('x-shadowlabel',class extends HTMLElement{connectedCallback(){const s=this.attachShadow({mode:'open'});s.innerHTML='<input id=sinp>';s.querySelector('input').ariaLabelledByElements=[document.getElementById('lbl')];}});
 customElements.define('form-ce',class extends HTMLElement{static formAssociated=true;constructor(){super();this.i=this.attachInternals();this.i.role='slider';this.i.ariaValueNow='3';this.i.ariaValueMin='0';this.i.ariaValueMax='5';this.tabIndex=0;}});
 </script></body></html>`;
 const r=await run(html,{xb1:$('#xb1'),xb2:$('#xb2'),xl:$('#xl'),ximg:$('#ximg'),xf:$('#xf'),refl:$('#refl'),reflbtn:$('#reflbtn'),sinp:'document.querySelector("#xsl").shadowRoot.querySelector("input")',inner:'document.querySelector("#dsd1").shadowRoot.querySelector("button")',inner2:'document.querySelector("#dsd2").shadowRoot.querySelector("button")',innerlink:'document.querySelector("#dsd3").shadowRoot.querySelector("a")',ii:'document.querySelector("#dsd4").shadowRoot.querySelector("input")',lightinp:$('#lightinp'),fce:$('#fce')},{ignore:IGN});
 console.log(rep('ElementInternals / reflection / DSD',r));
 await close();})();
