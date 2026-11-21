const { cases, close } = require('./multi');
const T = ['target-size-minimum'];
(async () => {
await cases([
 ['role tab 16px', `<div role="tablist"><div role="tab" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc">1</div><div role="tab" tabindex="-1" style="display:inline-block;width:16px;height:16px;background:#ccc">2</div></div>`],
 ['role switch/checkbox 16px', `<span role="switch" aria-checked="false" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span><span role="checkbox" aria-checked="false" tabindex="0" style="display:inline-block;width:16px;height:16px;background:#ccc"></span>`],
 ['role menuitem 16px', `<div role="menu"><div role="menuitem" tabindex="0" style="height:14px;font-size:12px;line-height:14px">Cut</div><div role="menuitem" tabindex="-1" style="height:14px;font-size:12px;line-height:14px">Copy</div></div>`],
 ['role option', `<div role="listbox"><div role="option" style="height:14px">A</div><div role="option" style="height:14px">B</div></div>`],
 ['overlay covering most of button', `<div style="position:relative"><button style="width:40px;height:40px;padding:0">a</button><button style="width:40px;height:40px;padding:0">b</button><div style="position:absolute;left:0;top:0;width:30px;height:40px;background:rgba(255,0,0,.3)"></div><div style="position:absolute;left:44px;top:0;width:30px;height:40px;background:rgba(255,0,0,.3)"></div></div>`],
], T);
await close();
})();
