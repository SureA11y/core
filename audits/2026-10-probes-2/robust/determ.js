const { chromium } = require('/home/user/core/node_modules/playwright');
const fs = require('fs');
const bundle = fs.readFileSync('/home/user/core/surea11y.browser.js', 'utf8');
const html = fs.readFileSync('rich.html', 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  await p.setContent(html);
  await p.evaluate(bundle + ';window.a11ycore=a11ycore;');
  const outs = [];
  for (let i = 0; i < 3; i++) outs.push(await p.evaluate(() => JSON.stringify(a11ycore.runa11yCoreInPage(location.href, null, {}, null).checksResults)));
  console.log(outs.map(o => o.length), outs[0] === outs[1], outs[1] === outs[2]);
  if (outs[0] !== outs[1]) { const a = JSON.parse(outs[0]), c = JSON.parse(outs[1]); a.forEach((x, i) => { if (JSON.stringify(x) !== JSON.stringify(c[i])) console.log('diff', x.ruleId, JSON.stringify(x).slice(0, 300), '\n vs', JSON.stringify(c[i]).slice(0, 300)); }); }
  await b.close();
})();
