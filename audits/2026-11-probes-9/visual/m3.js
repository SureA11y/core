const h = require('./h');
const css = '@keyframes fade{from{opacity:.2}to{opacity:1}} .a{animation:fade 3s forwards;color:#555;background:#fff;font:16px Arial}';
const light = `<main><p>Light DOM:</p><div class=a>Fading text in light DOM</div></main><style>${css}</style>`;
const shadow = `<main><p>Shadow:</p><div id=host></div></main><script>document.getElementById("host").attachShadow({mode:"open"}).innerHTML="<style>${css}</style><div class=a>Fading text in shadow DOM</div>"</script>`;
(async () => {
  for (const [n, html] of [['light', light], ['shadow', shadow]]) {
    for (const wait of [50, 3500]) {
      const page = await h.open(html);
      await new Promise(r => setTimeout(r, wait));
      const r = await h.scan(page, ['contrast-minimum']);
      console.log(n, 'after', wait, 'ms:', r[0].outcome, r[0].occ.map(o => o.code + ' ' + (o.d.colors ? o.d.colors.foregroundHex + ' r=' + o.d.metrics.ratio.toFixed(2) : '')).join());
      await page.context().close();
    }
  }
  await h.close();
})();
