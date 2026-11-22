const { ax, show, close } = require('./ax.js');
const { page } = require('./h.js');
const R = (n,v) => `<label><input type="radio" name="${n}" value="${v}"> ${v}</label>`;
(async () => {
  for (const [l, h] of [
   ['slotted', page(`<x-group id=h>${R('s','S')}${R('s','M')}</x-group><script>customElements.define('x-group', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<fieldset><legend>Size</legend><slot></slot></fieldset>'}});</script>`)],
   ['aria-hidden', page(`<div aria-hidden="true">${R('s','S')}${R('s','M')}</div>`)],
   ['legend img', page(`<fieldset><legend><img alt="Size" src="data:,"></legend>${R('s','S')}${R('s','M')}</fieldset>`)],
  ]) { const { nodes } = await ax(h); console.log(l, '=>', show(nodes)); }
  await close();
})();
