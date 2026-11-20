// focus-not-obscured: sticky header rendered inside a web component's shadow root vs the same header in light DOM
const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum'];
const links = Array.from({length: 80}, (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`).join('');
const shadow = `<style>body{margin:0}</style><x-hd></x-hd>${links}<script>customElements.define('x-hd', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<header style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff">Site</header>'}})</script>`;
const light = `<style>body{margin:0}</style><header style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff">Site</header>${links}`;
const gt = async (p) => {
  await p.evaluate(() => { document.getElementById('l29').focus({ preventScroll: true }); const k = document.getElementById('l30'); window.scrollTo(0, scrollY + k.getBoundingClientRect().top - 20); });
  await p.keyboard.press('Tab');
  return p.evaluate(() => { const k = document.getElementById('l30'); const r = k.getBoundingClientRect(); const h = document.elementFromPoint(r.left + 5, r.top + r.height / 2); const s = h.shadowRoot ? h.shadowRoot.elementFromPoint(r.left + 5, r.top + r.height / 2) : null; return { focused: document.activeElement.id, top: r.top, hit: h.tagName, inner: s && s.tagName }; });
};
(async () => {
  for (let i = 0; i < 2; i++) {
    for (const [k, h] of [['light', light], ['shadow', shadow]]) { const r = await run(h, R, { after: gt }); show(k + ' run' + i, r, false); console.log('   ground truth after Tab:', JSON.stringify(r.extra)); }
  }
  await close();
})();
