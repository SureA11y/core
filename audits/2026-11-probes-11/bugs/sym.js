const { cr, rule, brief, page, close } = require('./h.js');
const ids = ['symbol-graphic-contrast','contrast-minimum'];
(async () => {
  for (const [l, b] of [
    ['price with currency span', '<p style="color:#999">Price: <span class="cur">$</span>45.00 per item, taxes included.</p>'],
    ['woo bdi price', '<span class="amount" style="color:#999"><bdi><span class="sym">€</span>45,00</bdi></span>'],
    ['disabled close button ×', '<button disabled style="color:#ccc;background:#fff;border:1px solid #ccc">×</button>'],
    ['disabled stepper +', '<button disabled style="color:#ddd;background:#fff">+</button><input aria-label="Qty" value="1"><button style="color:#000">−</button>'],
    ['stars with sr-only text', '<span style="color:#ccc">★★★★☆<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">4 of 5</span></span>'],
    ['nested stars duplicates', '<span style="color:#ccc">★<b>★★</b></span>'],
    ['math operator in text "a + b"', '<p style="color:#999">a + b</p>'],
    ['degree sign "°C" alone in span', '<p style="color:#000">Temp 21<span style="color:#aaa">°C</span></p>'],
    ['CJK postal mark', '<p lang="ja" style="color:#000"><span style="color:#aaa">〒</span>100-0001 東京都</p>'],
  ]) {
    const r = await cr(page(b), ids);
    console.log('### ' + l); for (const id of ids) console.log('   ', id.padEnd(24), brief(rule(r, id)).slice(0, 330));
  }
  await close();
})();
