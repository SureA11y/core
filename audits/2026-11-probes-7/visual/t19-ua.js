// UA-control exception: a checkbox the author resized (width/height) but left appearance alone is still exempt
const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const mk = (s) => `<div style="display:flex;gap:2px"><input type="checkbox" style="margin:0;${s}"><input type="checkbox" style="margin:0;${s}"><input type="checkbox" style="margin:0;${s}"></div>`;
(async () => {
  for (let i = 0; i < 2; i++) {
    for (const [k, s] of [['unstyled', ''], ['author 10px', 'width:10px;height:10px'], ['author 10px + appearance:none', 'width:10px;height:10px;appearance:none;border:1px solid']]) {
      const r = await run(mk(s), R, { after: p => p.evaluate(() => { const b = document.querySelector('input').getBoundingClientRect(); return b.width + 'x' + b.height; }) });
      show(k + ' (' + r.extra + ') run' + i, r, false);
    }
  }
  await close();
})();
