// focus-not-obscured-minimum: a sticky 60px header cleared by html scroll-padding-top written several ways (all >= 60px at 768px viewport)
const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum'];
const links = Array.from({ length: 80 }, (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`).join('');
(async () => {
  for (const pad of ['0', '60px', '10%', 'calc(10% + 2px)', 'max(10%, 60px)', 'min(20%, 70px)', 'clamp(60px, 10%, 100px)', '8vh', 'calc(5% + 1rem + 8px)', 'calc(2 * 40px)', 'calc(100% / 10)']) {
    const r = await run(`<style>html{scroll-padding-top:${pad}}body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff">Site</header>${links}`, R, { after: (p) => p.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop) });
    const c = r.res[0];
    console.log(pad.padEnd(26), 'computed', String(r.extra).padEnd(22), c.outcome, c.occ.length, [...new Set(c.occ.map(o => o.rc))].join(','));
  }
  await close();
})();
