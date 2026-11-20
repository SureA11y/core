const { run, show, close } = require('./h');
const b = (t) => `<button style="all:unset;width:16px;height:16px;background:#ccc">${t}</button>`;
const def = `<script>customElements.define('x-h', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<button style="all:unset;width:16px;height:16px;display:block;background:#ccc">b</button>'}})</script>`;
(async () => {
  let r = await run(`<div style="display:flex">${b('a')}<x-h></x-h></div>${def}`, ['target-size-minimum','button-name-present']);
  show('shadow light-first', r, false);
  console.log(JSON.stringify(r.res.find(c=>c.ruleId==='button-name-present').occ.map(o=>o.sel)));
  r = await run(`<div style="display:flex"><x-h></x-h>${b('a')}</div>${def}`, ['target-size-minimum']);
  show('shadow shadow-first', r, false);
  r = await run(`<div style="display:flex"><x-h></x-h><x-h></x-h></div>${def}`, ['target-size-minimum']);
  show('two shadows', r, false);
  r = await run(`<div style="display:flex">${b('a')}<x-h></x-h></div>${def}`, ['target-size-minimum'], { eo: {} , before: async p => {} });
  await close();
})();
