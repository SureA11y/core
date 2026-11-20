// target-size-minimum: crowded toolbar fails alone; a consent backdrop over the viewport at scan time makes it pass
const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const toolbar = `<div style="display:flex;gap:2px;margin:20px">${['B','I','U','S'].map(t=>`<button style="all:unset;width:20px;height:20px;background:#ccc">${t}</button>`).join('')}</div>`;
const overlay = `<div style="position:fixed;inset:0;background:rgba(0,0,0,.5)"><div style="position:absolute;bottom:0;left:0;right:0;background:#fff;padding:16px">We use cookies. <button style="padding:12px 24px">Accept</button></div></div>`;
const banner = `<div style="position:fixed;top:0;left:0;right:0;height:120px;background:#fff">We use cookies. <button style="padding:12px 24px">Accept</button></div>`;
(async () => {
  for (let i = 0; i < 2; i++) {
    show('no overlay run' + i, await run(toolbar, R), false);
    show('consent backdrop run' + i, await run(toolbar + overlay, R), false);
    show('top banner run' + i, await run(toolbar + banner, R), false);
  }
  await close();
})();
