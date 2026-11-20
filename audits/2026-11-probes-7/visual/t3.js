const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const btn = (s, t) => `<button style="all:unset;box-sizing:border-box;position:absolute;background:#ccc;${s}">${t}</button>`;
const cases = {
  // A 16x16 icon; B "Edit" 26x17 at gap 2 -> centre d=23, region r=10
  iconPlusShort: `<div style="position:relative">${btn('left:0;top:0;width:16px;height:16px', 'x')}${btn('left:18px;top:0;width:26px;height:16px', 'Edit')}</div>`,
  // after moving apart by suggested shortfall (1px)
  iconPlusShortMoved: `<div style="position:relative">${btn('left:0;top:0;width:16px;height:16px', 'x')}${btn('left:19px;top:0;width:26px;height:16px', 'Edit')}</div>`,
  iconPlusShortMoved2: `<div style="position:relative">${btn('left:0;top:0;width:16px;height:16px', 'x')}${btn('left:21px;top:0;width:26px;height:16px', 'Edit')}</div>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R), true);
  await close();
})();
