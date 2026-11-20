// RW: an absolutely positioned element that escapes a non-positioned overflow box (its containing block is the page)
// widens the page, but the rule can't name it: HORIZONTAL_SCROLL_UNATTRIBUTED instead of HORIZONTAL_SCROLL on the element.
const h = require('./harness');
const D = '<!doctype html><html><head><meta charset=utf-8></head><body>';
const cases = {
  'abs tooltip escaping overflow-x:auto wrapper': `<div style="overflow-x:auto"><p>Table wrapper</p><div id="tip" style="position:absolute;top:60px;left:200px;width:300px">Tooltip text</div></div>`,
  'abs menu escaping overflow:hidden card': `<div style="overflow:hidden"><p>Card</p><div id="tip" style="position:absolute;top:60px;left:200px;width:300px">Dropdown menu text</div></div>`,
  'control: same element with no wrapper': `<div id="tip" style="position:absolute;top:60px;left:200px;width:300px">Tooltip text</div>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const r = await h.runChromium(D + frag + '</body></html>', 'reflow-horizontal-scroll', { after: () => document.scrollingElement.scrollWidth });
    console.log(name.padEnd(46), 'scrollWidth=' + r.extra, r.outcome, r.occ.map(o => `${o.code}@${o.sel}`).join(','));
  }
  await h.close();
})();
