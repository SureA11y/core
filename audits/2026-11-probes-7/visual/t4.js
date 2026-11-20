const { run, show, close } = require('./h');
const R = ['target-size-minimum','target-size-enhanced'];
const b = (t) => `<button style="all:unset;width:16px;height:16px;background:#ccc">${t}</button>`;
const cases = {
  shadow: { html: `<div style="display:flex">${b('a')}<x-h></x-h></div><script>customElements.define('x-h', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button style="all:unset;width:16px;height:16px;display:block;background:#ccc">b</button>'}})</script>` },
  iframe: { html: `<iframe style="border:0;width:300px;height:100px" srcdoc='<div style="display:flex"><button style="all:unset;width:16px;height:16px">a</button><button style="all:unset;width:16px;height:16px">b</button></div>'></iframe>`, before: p => p.waitForTimeout(300) },
  dpr2: { html: `<div style="display:flex;gap:4px">${b('a')}${b('b')}</div>`, dpr: 2 },
  dpr2b: { html: `<div style="display:flex;gap:7.5px"><button style="all:unset;width:16.5px;height:16px">a</button><button style="all:unset;width:16.5px;height:16px">b</button></div>`, dpr: 2 },
  forced: { html: `<div style="display:flex;gap:4px">${b('a')}${b('b')}</div>`, forcedColors: 'active' },
};
(async () => {
  for (const [k, c] of Object.entries(cases)) show(k, await run(c.html, R, { dpr: c.dpr, forcedColors: c.forcedColors, before: c.before, eo: { wcagLevel: 'AAA' } }), true);
  await close();
})();
