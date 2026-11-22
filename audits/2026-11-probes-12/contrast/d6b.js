const { cr, rule, brief, page, close } = require('./h.js');
const ids=['contrast-minimum','symbol-graphic-contrast'];
const mk=(attrs, inner)=>page(`<x-b></x-b><x-i></x-i><script>
customElements.define('x-b',class extends HTMLElement{connectedCallback(){${attrs};this.attachShadow({mode:'open'}).innerHTML='${inner}'}});
</script>`);
(async()=>{
 for (const [l,h] of [
  ['host role=button aria-disabled, shadow span text', mk("this.setAttribute('role','button');this.setAttribute('aria-disabled','true');this.tabIndex=0", '<span style="color:#aaa">Buy</span>')],
  ['host role=button aria-disabled, shadow text direct', mk("this.setAttribute('role','button');this.setAttribute('aria-disabled','true');this.tabIndex=0", '<span style="color:#aaa">×</span>')],
  ['host aria-disabled, shadow <button>', mk("this.setAttribute('aria-disabled','true')", '<button style="color:#aaa;background:#fff">Buy</button>')],
  ['host disabled button in shadow', mk("", '<button disabled style="color:#aaa;background:#fff">Buy</button>')],
  ['slotted text into aria-disabled shadow button', page(`<x-s>Buy now</x-s><script>customElements.define('x-s',class extends HTMLElement{connectedCallback(){this.attachShadow({mode:'open'}).innerHTML='<div role="button" tabindex="0" aria-disabled="true" style="color:#aaa"><slot></slot></div>'}})</script>`)],
 ]) { for (const root of ['main','br']) { const r=await cr(root,h,ids); console.log(l, root, ids.map(i=>brief(rule(r,i))).join(' / ').replace(/html > body > main > /g,'')); } }
 await close();
})();
