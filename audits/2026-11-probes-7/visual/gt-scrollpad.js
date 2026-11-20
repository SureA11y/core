// Ground truth: does Chromium honour a percentage scroll-padding-top when Tab moves focus under a sticky header?
const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const pad of ['0', '60px', '10%', 'calc(10% + 2px)']) {
    const p = await b.newPage({ viewport: { width: 1024, height: 768 } });
    const links = Array.from({length: 80}, (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`).join('');
    await p.setContent(`<!doctype html><style>html{scroll-padding-top:${pad}}body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff">Site</header>${links}`);
    const r = await p.evaluate(() => {
      const k = document.getElementById('l30'), prev = document.getElementById('l29');
      prev.focus({ preventScroll: true });
      window.scrollTo(0, window.scrollY + k.getBoundingClientRect().top - 20);
      return { before: k.getBoundingClientRect().top };
    });
    await p.keyboard.press('Tab');
    const after = await p.evaluate(() => ({ active: document.activeElement.id, top: document.getElementById('l30').getBoundingClientRect().top, cs: getComputedStyle(document.documentElement).scrollPaddingTop, hit: document.elementFromPoint(20, document.getElementById('l30').getBoundingClientRect().top + 5).tagName }));
    console.log(pad, JSON.stringify(r), JSON.stringify(after));
    await p.close();
  }
  await b.close();
})();
