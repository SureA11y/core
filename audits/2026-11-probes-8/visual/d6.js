// text-spacing: text in an open shadow root, and light text slotted into a clipping box in a shadow root
const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 const p = await b.newPage();
 await p.setContent(`<!doctype html><div id="h"></div><div id="s">Subscribe to our weekly news</div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div id=box style="width:220px;height:20px;overflow:hidden;font-size:16px">Subscribe to our weekly news</div>';document.getElementById('s').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px"><slot></slot></div>'</script>`);
 const f = () => { const out = {}; const sh = document.getElementById('h').shadowRoot.getElementById('box'); let r = document.createRange(); r.selectNodeContents(sh); out.shadow = [...r.getClientRects()].map(x => [Math.round(x.top), Math.round(x.bottom)]); out.shadowBox = Math.round(sh.getBoundingClientRect().bottom); const s = document.getElementById('s'); r = document.createRange(); r.selectNodeContents(s); out.slot = [...r.getClientRects()].map(x => [Math.round(x.top), Math.round(x.bottom)]); out.slotBox = Math.round(s.shadowRoot.firstChild.getBoundingClientRect().bottom); return out; };
 console.log('before', JSON.stringify(await p.evaluate(f)));
 await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
 console.log('after ', JSON.stringify(await p.evaluate(f)));
 await b.close();
})();
