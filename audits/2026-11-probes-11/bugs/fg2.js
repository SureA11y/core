const { both, page, close } = require('./h.js');
const ID='form-group-name-present';
const R = (n,v) => `<label><input type="radio" name="${n}" value="${v}"> ${v}</label>`;
(async () => {
  await both('DSD: light radios slotted into shadow fieldset', page(`<x-group><template shadowrootmode="open"><fieldset><legend>Size</legend><slot></slot></fieldset></template>${R('s','S')}${R('s','M')}</x-group>`), ID);
  await both('DSD: radios in shadow inside light fieldset', page(`<fieldset><legend>Size</legend><x-r><template shadowrootmode="open">${R('s','S')}${R('s','M')}</template></x-r></fieldset>`), ID);
  await both('DSD: radiogroup in shadow labelled, radios slotted', page(`<x-g><template shadowrootmode="open"><p id=q>Size</p><div role="radiogroup" aria-labelledby="q"><slot></slot></div></template>${R('s','S')}${R('s','M')}</x-g>`), ID);
  await both('legend with img alt only', page(`<fieldset><legend><img alt="Size" src="x.png"></legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('legend with svg title only', page(`<fieldset><legend><svg role="img" aria-label="Size" width=10 height=10></svg></legend>${R('s','S')}${R('s','M')}</fieldset>`), ID);
  await both('aria-hidden ancestor', page(`<div aria-hidden="true">${R('s','S')}${R('s','M')}</div>`), ID);
  await both('role=none on radios? (ignored on focusable)', page(`<fieldset><legend>Q</legend>${R('s','S')}${R('s','M')}</fieldset><div>${R('t','A')}${R('t','B')}</div>`), ID);
  await close();
})();
