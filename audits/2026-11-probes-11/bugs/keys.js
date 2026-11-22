const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();await p.setContent('<p>x');await p.addScriptTag({path:'/home/user/core-r11/surea11y.browser.js'});
console.log(await p.evaluate(()=>{const o=window.a11ycore;return Object.keys(o).join(' ')+'\n'+(o.helpers?Object.keys(o.helpers).join(' '):'')}));await b.close()})();
