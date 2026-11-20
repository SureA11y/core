const { run, show, close } = require('./h');
const b = (t) => `<button style="all:unset;width:16px;height:16px;display:inline-block;background:#ccc">${t}</button>`;
(async () => {
  // one shadow root holding a toolbar of 3 small buttons
  let r = await run(`<x-tb></x-tb><script>customElements.define('x-tb', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div style="display:flex">${b('B')}${b('I')}${b('U')}</div>'}})</script>`, ['target-size-minimum']);
  show('toolbar in one shadow root', r, false);
  // same in light DOM for comparison
  r = await run(`<div style="display:flex">${b('B')}${b('I')}${b('U')}</div>`, ['target-size-minimum']);
  show('toolbar light', r, false);
  // ground truth: what elementFromPoint returns
  r = await run(`<x-tb></x-tb><script>customElements.define('x-tb', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<div style="display:flex">${b('B')}${b('I')}${b('U')}</div>'}})</script>`, [], { after: p => p.evaluate(() => { const h = document.elementFromPoint(20, 12); const s = document.querySelector('x-tb').shadowRoot.elementFromPoint(20,12); return [h.tagName, s.tagName + ':' + s.textContent]; }) });
  console.log('elementFromPoint ->', r.extra);
  await close();
})();
