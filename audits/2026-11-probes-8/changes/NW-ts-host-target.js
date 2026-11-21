// target-size-minimum: a shadow host that is itself the target (role=button custom element drawing its face in its shadow root)
// beside light-DOM buttons. The new hit test drills into the host's shadow root and then asks host.contains(innerNode),
// which is false across a shadow boundary, so the host reads as "covered".
const { run, show, close } = require('./h');
const R = ['target-size-minimum'];
const btn = (t) => `<button style="all:unset;display:inline-block;width:16px;height:16px;background:#ccc">${t}</button>`;
const def = `<script>customElements.define('x-icon-btn', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<span style="display:inline-block;width:16px;height:16px;background:#888"></span>'; } });</script>`;
const host = (l) => `<x-icon-btn role="button" tabindex="0" aria-label="${l}" style="display:inline-block;width:16px;height:16px"></x-icon-btn>`;
const cases = {
  'light, host': `${def}<div style="display:flex;gap:2px;margin:20px">${btn('a')}${host('h')}</div>`,
  'host, light, light': `${def}<div style="display:flex;gap:2px;margin:20px">${host('h')}${btn('a')}${btn('b')}</div>`,
  'light, host, light': `${def}<div style="display:flex;gap:2px;margin:20px">${btn('a')}${host('h')}${btn('b')}</div>`,
};
(async () => {
  for (const [k, html] of Object.entries(cases)) for (const core of ['old', 'new']) show(k + ' ' + core, await run(html, R, { core }));
  await close();
})();
