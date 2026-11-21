// target-size-minimum: small crowded targets in shadow roots (open, nested, slotted, closed), old vs new
const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const btn = (t) => `<button style="all:unset;display:inline-block;width:16px;height:16px;background:#ccc">${t}</button>`;
const def = (name, inner, mode = 'open') => `<script>customElements.define('${name}', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'${mode}'}).innerHTML = ${JSON.stringify(inner)}; } });</script>`;
const cases = {
  light: `<div style="display:flex;gap:2px;margin:20px">${btn('a')}${btn('b')}${btn('c')}</div>`,
  open: `${def('x-bar', `<div style="display:flex;gap:2px;margin:20px">${btn('a')}${btn('b')}${btn('c')}</div>`)}<x-bar></x-bar>`,
  nested: `${def('x-in', `<div style="display:flex;gap:2px">${btn('a')}${btn('b')}</div>`)}${def('x-out', `<div style="margin:20px"><x-in></x-in></div>`)}<x-out></x-out>`,
  hostAndLight: `${def('x-one', btn('s'))}<div style="display:flex;gap:2px;margin:20px">${btn('a')}<x-one></x-one>${btn('c')}</div>`,
  slotted: `${def('x-slot', `<div style="display:flex;gap:2px;margin:20px"><slot></slot></div>`)}<x-slot>${btn('a')}${btn('b')}</x-slot>`,
  closed: `${def('x-closed', `<div style="display:flex;gap:2px;margin:20px">${btn('a')}${btn('b')}</div>`, 'closed')}<x-closed></x-closed>`,
  hostButton: `${def('x-btn', `<span style="display:inline-block;width:16px;height:16px;background:#ccc"></span>`)}<div style="display:flex;gap:2px;margin:20px"><x-btn role="button" tabindex="0" aria-label="a"></x-btn><x-btn role="button" tabindex="0" aria-label="b"></x-btn></div>`,
};
(async () => {
  for (const [k, html] of Object.entries(cases)) for (const core of ['old', 'new']) show(k + ' ' + core, await run(html, R, { core }));
  await close();
})();
