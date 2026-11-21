const h = require('./h');
const cases = require('./fi1.js').filter(c => /outline-color only|outline-width only|border-color|underline on|box-shadow|var none|replacement via var/.test(c[0]));
(async () => {
  for (const [n, [html]] of cases) {
    const page = await h.open(html);
    const box = await page.evaluate(() => { const r = document.getElementById('t').getBoundingClientRect(); return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.width + 16, height: r.height + 16 }; });
    const before = await page.screenshot({ clip: box });
    await page.keyboard.press('Tab');
    const fv = await page.evaluate(() => [document.activeElement.id, document.activeElement.matches(':focus-visible'), getComputedStyle(document.activeElement).outlineStyle, getComputedStyle(document.activeElement).boxShadow]);
    const after = await page.screenshot({ clip: box });
    console.log(n.padEnd(34), 'focused', fv.join(' '), 'pixels changed:', !before.equals(after));
    await page.context().close();
  }
  await h.close();
})();
