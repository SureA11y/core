const { ax, show, close } = require('./ax.js');
const { page } = require('./h.js');
const R = (n,v) => `<label><input type="radio" name="${n}" value="${v}"> ${v}</label>`;
(async () => {
  for (const [l, h] of [
   ['DSD radios in shadow in light fieldset', page(`<fieldset><legend>Size</legend><x-r><template shadowrootmode="open">${R('s','S')}${R('s','M')}</template></x-r></fieldset>`)],
   ['DSD radiogroup in shadow, radios slotted', page(`<x-g><template shadowrootmode="open"><p id=q>Size</p><div role="radiogroup" aria-labelledby="q"><slot></slot></div></template>${R('s','S')}${R('s','M')}</x-g>`)],
  ]) { const { nodes } = await ax(h); console.log(l, '=>', show(nodes)); }
  await close();
})();
