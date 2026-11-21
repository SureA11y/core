const { cases, close } = require('./multi');
const S = ['text-spacing-content-loss'];
(async () => {
await cases([
 ['fixed-height button overflow hidden', `<button style="width:120px;height:32px;overflow:hidden;font-size:16px;line-height:1.2">Subscribe to newsletter now</button>`],
 ['fixed-height a overflow hidden (widthless)', `<a href="#" style="display:inline-block;width:150px;height:20px;overflow:hidden;font-size:16px;line-height:20px">Read the full article</a>`],
 ['ellipsis nowrap', `<div style="width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">The quick brown fox jumps</div>`],
 ['fixed-height no clipping overlap', `<div style="height:40px;width:160px">The quick brown fox jumps over the lazy dog again</div><div>Next block of text here</div>`],
 ['border-radius pill overflow hidden', `<span style="display:inline-block;width:110px;height:24px;line-height:24px;border-radius:12px;overflow:hidden;white-space:nowrap">Free shipping</span>`],
 ['clip-path inset box', `<div style="width:150px;height:22px;clip-path:inset(0)">Some long text that wraps here</div>`],
 ['shadow fixed height', `<div id="h"></div><script>const s=document.getElementById('h').attachShadow({mode:'open'});s.innerHTML='<div style="width:150px;height:22px;overflow:hidden;line-height:20px">Some long text that wraps here</div>'</script>`],
 ['svg text fixed', `<svg width="120" height="30" style="overflow:hidden"><text x="0" y="20">Long label in an svg chart</text></svg>`],
 ['foreignObject clip', `<svg width="150" height="22"><foreignObject width="150" height="22"><div xmlns="http://www.w3.org/1999/xhtml" style="line-height:20px">Some long text that wraps here</div></foreignObject></svg>`],
 ['input value long fixed width', `<input value="A very long value that is in the field" style="width:120px">`],
 ['select fixed width', `<select style="width:100px"><option>Option with long words</option></select>`],
 ['grid fixed rows overflow hidden parent', `<div style="display:grid;grid-template-rows:20px;overflow:hidden;height:20px;width:140px"><div>Words that will wrap under spacing</div></div>`],
], S);
await close();
})();
