// RW: carousel (row of items each fitting the box that scrolls them). Lean is computed on the cut ITEM's children,
// not on the row; and an item holding a field makes the whole result FAIL although each item fits.
const h = require('./harness');
const D = '<!doctype html><html><head><meta charset=utf-8></head><body>';
const row = (item) => `<ul style="display:flex;overflow-x:auto;gap:8px;padding:0;margin:0;list-style:none">${[1,2,3,4].map(item).join('')}</ul>`;
const cases = {
  'items with 2 children (img+p)': row(i => `<li style="flex:0 0 85%"><img alt="" style="width:100%;height:60px"><p>Item ${i} text</p></li>`),
  'items with 1 child (a.card)': row(i => `<li style="flex:0 0 85%"><a href="#" class="card">Item ${i} text</a></li>`),
  'items with 1 child (div wrapper of img+p)': row(i => `<li style="flex:0 0 85%"><div><img alt="" style="width:100%;height:60px"><p>Item ${i} text</p></div></li>`),
  'items holding a qty field': row(i => `<li style="flex:0 0 85%"><p>Product ${i}</p><label>Qty <input type="number" value="1" style="width:150px"></label></li>`),
  'filter chips, custom checkbox (opacity 0 input over label)': `<div style="display:flex;overflow-x:auto;gap:6px;white-space:nowrap">${['Red','Green','Blue','Yellow','Purple','Orange','Black','White'].map(c=>`<label style="position:relative;border:1px solid;padding:4px 10px"><input type="checkbox" style="position:absolute;inset:0;opacity:0;margin:0;width:100%;height:100%">${c}</label>`).join('')}</div>`,
  'filter chips, links (control)': `<div style="display:flex;overflow-x:auto;gap:6px;white-space:nowrap">${['Red','Green','Blue','Yellow','Purple','Orange','Black','White'].map(c=>`<a href="#" style="border:1px solid;padding:4px 10px">${c}</a>`).join('')}</div>`,
};
(async () => {
  for (const [name, frag] of Object.entries(cases)) for (let i = 0; i < 2; i++) {
    const r = await h.runChromium(D + frag + '</body></html>', 'reflow-horizontal-scroll');
    console.log(name.padEnd(58), r.outcome, r.occ.map(o => `${o.o}:${o.code}:${o.lean||'-'}@${o.sel}`).join(','));
  }
  await h.close();
})();
