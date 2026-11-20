const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const cases = {
  // spacing at exactly 24 centre distance
  gap4: `<div style="display:flex;gap:4px"><button style="all:unset;width:20px;height:20px;background:#ccc">a</button><button style="all:unset;width:20px;height:20px;background:#ccc">b</button></div>`,
  gap3_99: `<div style="display:flex;gap:3.99px"><button style="all:unset;width:20px;height:20px;background:#ccc">a</button><button style="all:unset;width:20px;height:20px;background:#ccc">b</button></div>`,
  w23_99: `<div style="display:flex;gap:0"><button style="all:unset;width:23.99px;height:30px;background:#ccc">a</button><button style="all:unset;width:30px;height:30px;background:#ccc">b</button></div>`,
  w24: `<div style="display:flex;gap:0"><button style="all:unset;width:24px;height:24px;background:#ccc">a</button><button style="all:unset;width:24px;height:24px;background:#ccc">b</button></div>`,
  // small next to big: region distance
  smallBig: `<div style="display:flex;gap:2px"><button style="all:unset;width:16px;height:16px;background:#ccc">a</button><button style="all:unset;width:100px;height:40px;background:#ccc">b</button></div>`,
  // zoom 2: 12px button rendered 24px
  zoom2: `<div style="zoom:2;display:flex"><button style="all:unset;width:12px;height:12px;background:#ccc">a</button><button style="all:unset;width:12px;height:12px;background:#ccc">b</button></div>`,
  zoomHalf: `<div style="zoom:0.5;display:flex"><button style="all:unset;width:40px;height:40px;background:#ccc">a</button><button style="all:unset;width:40px;height:40px;background:#ccc">b</button></div>`,
  scale2: `<div style="transform:scale(2);transform-origin:0 0;display:flex"><button style="all:unset;width:12px;height:12px;background:#ccc">a</button><button style="all:unset;width:12px;height:12px;background:#ccc">b</button></div>`,
  rtl: `<div dir="rtl" style="display:flex;gap:2px"><button style="all:unset;width:16px;height:16px;background:#ccc">a</button><button style="all:unset;width:100px;height:40px;background:#ccc">b</button></div>`,
  inlineSentence: `<p>Read the <a href="#">docs</a> and the <a href="#">faq</a> before posting.</p>`,
  pagination: `<nav><a href="#">1</a> <a href="#">2</a> <a href="#">3</a> <a href="#">4</a></nav>`,
  editDelete: `<p><a href="#">Edit</a> | <a href="#">Delete</a></p>`,
  checkboxLabel: `<label><input type="checkbox"> Remember me</label><br><label><input type="checkbox"> Newsletter</label>`,
  checkboxStyled: `<label><input type="checkbox" style="appearance:none;width:16px;height:16px;border:1px solid;margin:0"> A</label><br><label><input type="checkbox" style="appearance:none;width:16px;height:16px;border:1px solid;margin:0"> B</label>`,
  radioSized: `<label><input type="radio" name=r style="width:12px;height:12px;margin:0"> A</label><br><label><input type="radio" name=r style="width:12px;height:12px;margin:0"> B</label>`,
  slider: `<input type="range"><br><input type="range">`,
  iconToolbar: `<div role="toolbar" style="display:flex;gap:2px"><button style="all:unset;width:20px;height:20px">B</button><button style="all:unset;width:20px;height:20px">I</button><button style="all:unset;width:20px;height:20px">U</button></div>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R), true);
  await close();
})();
