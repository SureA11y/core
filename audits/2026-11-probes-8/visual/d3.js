const { cases, close } = require('./multi');
const S = ['text-spacing-content-loss'];
(async () => {
await cases([
 ['plain fits->clips', `<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div>`],
 ['clip-path inset fits->clips', `<div style="width:220px;height:20px;clip-path:inset(0);line-height:18px;font-size:16px">Subscribe to our weekly news</div>`],
 ['shadow fits->clips', `<div id="h"></div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div>'</script>`],
 ['slot text fits->clips', `<div id="h">Subscribe to our weekly news</div><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px"><slot></slot></div>'</script>`],
 ['foreignObject fits->clips', `<svg width="220" height="20"><foreignObject width="220" height="20"><div xmlns="http://www.w3.org/1999/xhtml" style="line-height:18px;font-size:16px">Subscribe to our weekly news</div></foreignObject></svg>`],
 ['svg text in fixed svg', `<svg width="200" height="24"><text x="0" y="18" font-size="16">Subscribe to our weekly news</text></svg>`],
 ['iframe srcdoc fits->clips', `<iframe style="width:240px;height:40px;border:0" srcdoc="<div style='width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px'>Subscribe to our weekly news</div>"></iframe>`],
 ['vertical-rl fits->clips', `<div style="writing-mode:vertical-rl;height:220px;width:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div>`],
 ['rtl fits->clips', `<div dir="rtl" style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">اشترك في النشرة الإخبارية</div>`],
 ['zoom fits->clips', `<div style="zoom:2"><div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div></div>`],
 ['transform scale fits->clips', `<div style="transform:scale(1.5);transform-origin:0 0"><div style="width:220px;height:20px;overflow:hidden;line-height:18px;font-size:16px">Subscribe to our weekly news</div></div>`],
 ['contain size grid', `<div style="display:grid;grid-template-columns:200px;grid-template-rows:20px;overflow:hidden;height:20px"><span style="line-height:18px">Subscribe to our weekly news</span></div>`],
 ['tooltip abs inside overflow hidden ancestor not containing block', `<div style="overflow:hidden;width:220px;height:20px;position:relative"><div style="position:static"><span style="line-height:18px">Subscribe to our weekly news</span></div></div>`],
 ['text-overflow ellipsis fits->ellipsis', `<div style="width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px">Subscribe to our weekly news</div>`],
], S);
await close();
})();
