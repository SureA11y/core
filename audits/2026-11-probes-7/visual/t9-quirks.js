const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum'];
const links = Array.from({length: 80}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
const fixedHdr = `<style>body{margin:0;padding-top:60px}</style><header style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff">Site</header>${links}`;
const footer = `<style>body{margin:0}</style>${links}<div style="position:fixed;bottom:0;left:0;right:0;height:80px;background:#333;color:#fff">Cookies</div>`;
(async () => {
  for (const q of [false, true]) {
    show('fixedHdr quirks=' + q, await run(fixedHdr, R, { quirks: q }), false);
    const r = await run(footer, R, { quirks: q, after: p => p.evaluate(() => ({ mode: document.compatMode, htmlCH: document.documentElement.clientHeight, bodyCH: document.body.clientHeight, inner: innerHeight })) });
    show('footer quirks=' + q, r, true); console.log('  ', r.extra);
  }
  await close();
})();
