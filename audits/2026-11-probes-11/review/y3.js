const { chromium } = require('/home/user/core-r11/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.setContent('<fieldset disabled><legend><button id=b>x</button></legend><button id=c>y</button></fieldset>');
console.log(await p.evaluate(()=>[b.matches(':disabled'), c.matches(':disabled')]));await b.close();})();
