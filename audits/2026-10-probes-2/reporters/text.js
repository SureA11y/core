const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage();
  await p.goto('file://' + process.argv[2]);
  await p.evaluate(() => { document.querySelector('details').open = true; });
  console.log(await p.evaluate(() => document.body.innerText));
  await b.close();
})();
