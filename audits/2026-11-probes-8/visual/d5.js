const { cases, close } = require('./multi');
const S = ['text-spacing-content-loss'];
(async () => {
const L = [
 ['shadow fits->clips', `<div id="h"></div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div><p>light text</p>'</script>`],
 ['slot text fits->clips', `<div id="h">Subscribe to our weekly news</div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px"><slot></slot></div>'</script>`],
 ['rtl hebrew', `<div dir="rtl" style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div>`],
];
await cases(L, S);
await cases(L, S, { eo: { includeShadowDOM: true } });
await close();
})();
