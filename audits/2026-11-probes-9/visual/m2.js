const h = require('./h');
(async () => {
  const html = require('./m1.js').find(c => c[0] === 'shadow dom')[1][0];
  const page = await h.open(html);
  console.log(await page.evaluate(() => ({ doc: document.getAnimations().length, names: document.getAnimations().map(a => a.animationName + ' ' + (a.effect.target && a.effect.target.className)), tx: getComputedStyle(document.getElementById('host').shadowRoot.querySelector('.a')).transform })));
  await new Promise(r => setTimeout(r, 300));
  console.log(await page.evaluate(() => getComputedStyle(document.getElementById('host').shadowRoot.querySelector('.a')).transform));
  const r = await h.scan(page, ['moving-content-pausable']); h.show(r, true);
  await h.close();
})();
