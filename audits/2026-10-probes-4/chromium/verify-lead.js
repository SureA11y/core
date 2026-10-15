const {run,rep}=require('./nh.js');const {getBrowser}=require('./h.js');
(async()=>{
 const a=await run(`<label>Fruit <select><button><selectedcontent></selectedcontent></button><option>Apple</option><option>Pear</option></select></label>`,{sel:"document.querySelector('select')",btn:"document.querySelector('select button')"});
 console.log(rep('B1 customizable select',a));
 const b=await run(`<span id="lbl">Email address</span><input id="f"><button id="b"></button>`,{f:"document.getElementById('f')",b:"document.getElementById('b')"},{setup:"f.ariaLabelledByElements=[lbl]; b.ariaLabelledByElements=[lbl];"});
 console.log(rep('B3 element refs',b));
 const c=await run(`<x-icon-btn role="button" tabindex="0"><span aria-hidden="true">*</span></x-icon-btn>`,{x:"document.querySelector('x-icon-btn')"},{setup:"customElements.define('x-icon-btn', class extends HTMLElement{constructor(){super();this.attachInternals().ariaLabel='Save';}}); document.body.innerHTML+='';"});
 console.log(rep('B2 internals',c));
 process.exit(0);})();
