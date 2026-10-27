const {getBrowser,close}=require('./h.js');
(async()=>{const b=await getBrowser();const ctx=await b.newContext();const p=await ctx.newPage();
await p.setContent(`<x-c id=cb role=checkbox tabindex=0>Subscribe</x-c><x-c id=sl role=slider tabindex=0 aria-label="Volume"></x-c><script>customElements.define('x-c',class extends HTMLElement{constructor(){super();this.i=this.attachInternals();}connectedCallback(){if(this.id==='cb')this.i.ariaChecked='true';if(this.id==='sl'){this.i.ariaValueNow='5';this.i.ariaValueMin='0';this.i.ariaValueMax='10';}}});</script>`);
const cdp=await ctx.newCDPSession(p);const {nodes}=await cdp.send('Accessibility.getFullAXTree');
for(const n of nodes) if(n.role&&['checkbox','slider'].includes(n.role.value)) console.log(n.role.value,JSON.stringify((n.properties||[]).map(x=>x.name+'='+JSON.stringify(x.value.value))), n.value&&n.value.value);
await close();})();
