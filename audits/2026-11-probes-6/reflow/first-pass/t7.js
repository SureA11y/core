const { page, runCases } = require('./harness');
const P = page;
const card = '.card{overflow:hidden;border:1px solid} .row{display:flex;width:560px} .row>*{flex:none;width:270px}';
runCases([
  { name: 'page scrolled to the right before scan', html: P('', '<div id="w" style="width:600px">Wide</div><p id="p">fits</p>'), opts: { before: (p) => p.evaluate(() => scrollTo(1000, 0)) } },
  { name: 'RTL page scrolled to the left before scan', html: P('', '<div id="w" style="width:600px">Wide</div>', 'dir="rtl"'), opts: { before: (p) => p.evaluate(() => scrollTo(-1000, 0)) } },
  { name: 'RTL card clipped', html: P(card, '<div class="card"><div class="row" id="rail"><a href=#>One</a><a href=#>Two</a></div></div>', 'dir="rtl"') },
  { name: 'body dir=rtl + body overflow-x:hidden, wide cut at left', html: '<!doctype html><html lang="ar"><head><title>t</title></head><body dir="rtl" style="margin:8px;overflow-x:hidden"><div id="w" style="width:600px">بداية النص هنا نهاية</div></body></html>' },
  { name: 'open shadow + body overflow-x:hidden (cut by edge)', html: P('body{overflow-x:hidden}', '<x-card id="host" style="display:block"></x-card>'), opts: { before: (p) => p.evaluate(() => { const s = document.getElementById('host').attachShadow({ mode: 'open' }); s.innerHTML = '<div id="inner" style="width:600px">Wide shadow content cut</div>'; }) } },
  { name: 'open shadow card clipping a form', html: P('', '<x-card id="host" style="display:block"></x-card>'), opts: { before: (p) => p.evaluate(() => { const s = document.getElementById('host').attachShadow({ mode: 'open' }); s.innerHTML = '<div style="overflow:hidden"><div style="display:flex;width:560px"><input style="flex:none;width:270px" aria-label=a><input style="flex:none;width:270px" aria-label=b></div></div>'; }) } },
  { name: 'excludeSelectors on the clipping card', html: P(card, '<div class="card" id="c"><div class="row" id="rail"><a href=#>One</a><a href=#>Two</a></div></div>'), opts: { engineOptions: { excludeSelectors: ['#c'] } } },
  { name: 'scope to the card', html: P(card, '<main id="m"><div class="card"><div class="row" id="rail"><a href=#>One</a><a href=#>Two</a></div></div></main><p>x</p>'), opts: { scope: '#m' } },
  { name: 'element vertically wholly outside its clip box (collapsed panel), crosses horizontally', html: P('', '<div style="overflow:hidden;height:40px"><p>Summary line</p><div id="hid" style="width:600px;margin-top:200px">Hidden below the fold of the collapsed panel</div></div>') },
  { name: '51 wide elements (cap)', html: P('', Array.from({ length: 55 }, (_, i) => `<div style="width:600px">w${i}</div>`).join('')) },
]);
