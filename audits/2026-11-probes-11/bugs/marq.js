const { both, page, close } = require('./h.js');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.setContent('<marquee hidden id=a>x</marquee><marquee id=b style="display:none">y</marquee><div hidden><marquee id=c>z</marquee></div><marquee id=d style="visibility:hidden">w</marquee>');
  console.log(await p.evaluate(() => ['a','b','c','d'].map(i => { const e = document.getElementById(i); return i + ': display=' + getComputedStyle(e).display + ' rects=' + e.getClientRects().length; }).join(' | ')));
  await b.close();
  await both('marquee hidden attr', page('<marquee hidden>x</marquee>'), 'deprecated-elements-not-used');
  await both('marquee display none', page('<marquee style="display:none">x</marquee>'), 'deprecated-elements-not-used');
  await both('marquee in hidden div', page('<div hidden><marquee>x</marquee></div>'), 'deprecated-elements-not-used');
  await both('marquee hidden attr', page('<marquee hidden>x</marquee>'), 'moving-content-pausable');
  await close();
})();
