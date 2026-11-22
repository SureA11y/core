const { both, page, close, cr } = require('./h.js');
const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage();
  await p.setContent('<button tabindex="1.5">a</button><button tabindex="0x1">b</button><button tabindex="1e3">c</button><button tabindex="2abc">d</button><button tabindex="-0">e</button><button tabindex="٣">f</button>');
  console.log('DOM tabIndex:', await p.evaluate(() => [...document.querySelectorAll('button')].map(x => x.getAttribute('tabindex') + '=>' + x.tabIndex).join('  '))); await b.close();
  for (const v of ['1.5', '0x1', '1e3', '2abc', '-0']) await both('tabindex ' + v, page(`<button tabindex="${v}">x</button>`), 'tabindex');
  await close();
})();
