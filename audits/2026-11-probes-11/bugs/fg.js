const { both, page, close } = require('./h.js');
const ID='form-group-name-present';
(async () => {
  const R = (n,v) => `<label><input type="radio" name="${n}" value="${v}"> ${v}</label>`;
  await both('baseline fieldset', page(`<form><fieldset><legend>Size</legend>${R('s','S')}${R('s','M')}</fieldset></form>`), ID);
  await both('shadow: light radios slotted into shadow fieldset', page(`<x-group id=h>${R('s','S')}${R('s','M')}</x-group><script>
   customElements.define('x-group', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<fieldset><legend>Size</legend><slot></slot></fieldset>'}});</script>`), ID);
  await both('shadow: radios in shadow, fieldset in light', page(`<fieldset><legend>Size</legend><x-r></x-r></fieldset><script>
   customElements.define('x-r', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='${R('s','S')}${R('s','M')}'.replace(/"/g,'"')}});</script>`), ID);
  await both('radiogroup aria-labelledby', page(`<p id=q>Size</p><div role="radiogroup" aria-labelledby="q">${R('s','S')}${R('s','M')}</div>`), ID);
  await both('fieldset legend visually hidden', page(`<fieldset><legend style="position:absolute;clip:rect(0 0 0 0);width:1px;height:1px;overflow:hidden">Size</legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('fieldset legend display none', page(`<fieldset><legend style="display:none">Size</legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('radios in form via form= attribute, outside', page(`<form id=f><fieldset><legend>Size</legend>${R('s','S')}</fieldset></form><input type=radio name=s form=f aria-label=M>`), ID);
  await both('woo payment methods ul', page(`<form><ul class="wc_payment_methods"><li><input id=a type="radio" name="payment_method" value="bacs"><label for=a>Bank</label></li><li><input id=b type="radio" name="payment_method" value="cod"><label for=b>Cash</label></li></ul></form>`), ID);
  await both('opacity0 custom radios (visually hidden inputs)', page(`<fieldset><legend>Size</legend><label><input type=radio name=s style="opacity:0;position:absolute">S</label><label><input type=radio name=s style="opacity:0;position:absolute">M</label></fieldset>`), ID);
  await both('aria-hidden on group container', page(`<div aria-hidden="true">${R('s','S')}${R('s','M')}</div>`), ID);
  await both('inert container', page(`<div inert>${R('s','S')}${R('s','M')}</div>`), ID);
  await both('radios with same name, one disabled', page(`${R('s','S')}<label><input type=radio name=s disabled> M</label>`), ID);
  await both('details closed', page(`<details><summary>More</summary>${R('s','S')}${R('s','M')}</details>`), ID);
  await both('fieldset role=radiogroup legend', page(`<fieldset role="radiogroup"><legend>Size</legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('fieldset role=group legend', page(`<fieldset role="group"><legend>Size</legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('div role=group, label via aria-labelledby to hidden', page(`<span id=q hidden>Size</span><div role="group" aria-labelledby="q">${R('s','S')}${R('s','M')}</div>`), ID);
  await both('table matrix', page(`<table><tr><th></th><th>Yes</th><th>No</th></tr><tr><th id=r1>Q1</th><td><input type=radio name=q1 aria-labelledby="r1"></td><td><input type=radio name=q1 aria-label="No"></td></tr></table>`), ID);
  await both('legend empty but aria-label on fieldset', page(`<fieldset aria-label="Size"><legend></legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('legend with only img alt', page(`<fieldset><legend><img alt="Size" src="data:,"></legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('fieldset nested: inner unnamed outer named', page(`<fieldset><legend>Size</legend><fieldset>${R('s','S')}${R('s','M')}</fieldset></fieldset>`), ID);
  await close();
})();
