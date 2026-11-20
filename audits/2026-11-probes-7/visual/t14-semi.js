// A semi-transparent sticky header: minimum passes (shows through), enhanced says "entirely hidden"
const { run, show, close } = require('./h');
const links = Array.from({length: 80}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
(async () => {
  for (const bg of ['background:rgba(255,255,255,.8)', 'background:#fff;opacity:.9']) for (let i = 0; i < 2; i++) {
    const r = await run(`<style>body{margin:0}</style><header style="position:sticky;top:0;height:60px;${bg}">Site</header>${links}`, ['focus-not-obscured-minimum','focus-not-obscured-enhanced'], { eo: { wcagLevel: 'AAA' } });
    show(bg + ' run' + i, r, true);
  }
  await close();
})();
