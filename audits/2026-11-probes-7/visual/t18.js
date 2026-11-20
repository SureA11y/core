const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const tb = `<div style="display:flex;gap:2px">${['B','I'].map(t=>`<button style="all:unset;width:12px;height:12px;background:#ccc">${t}</button>`).join('')}</div>`;
(async () => {
  show('zoom1.5 div', await run(`<div style="zoom:1.5">${tb}</div>`, R), true);
  show('zoom1.5 html', await run(`<style>html{zoom:1.5}</style>${tb}`, R), true);
  show('scale1.5', await run(`<div style="transform:scale(1.5);transform-origin:0 0">${tb}</div>`, R), true);
  show('rotate45 24px', await run(`<div style="display:flex;gap:30px;margin:40px"><button style="all:unset;width:24px;height:24px;background:#ccc;transform:rotate(45deg)">a</button><button style="all:unset;width:24px;height:24px;background:#ccc;transform:rotate(45deg)">b</button></div>`, R), true);
  await close();
})();
