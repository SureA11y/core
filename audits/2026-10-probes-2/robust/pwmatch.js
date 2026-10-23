const { chromium } = require('/home/user/core/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  for (const n of [4000, 8000, 16000]) {
    const r = await p.evaluate((n) => {
      document.body.innerHTML = '<main>' + '<img><span></span>'.repeat(n) + '</main>';
      const imgs = [...document.querySelectorAll('img')];
      let t = performance.now();
      imgs.forEach((el, i) => el.matches('html > body > main > img:nth-of-type(' + (i + 1) + ')'));
      const a = performance.now() - t;
      t = performance.now();
      imgs.forEach((el, i) => el.matches('html > body > main > img'));
      return [a, performance.now() - t];
    }, n);
    console.log(n, r.map(Math.round));
  }
  await b.close();
})();
