const h = require('./h');
(async () => {
  const html = require('./hf3.js').find(c => /slotted/.test(c[0]))[1][0];
  const page = await h.open(html);
  await page.keyboard.press('Tab');
  console.log(await page.evaluate(() => { const a = document.activeElement; return [a.id, a.getBoundingClientRect().x, getComputedStyle(a).left]; }));
  const r = await h.scan(page, ['css-hidden-focus']); h.show(r, true);
  await h.close();
})();
