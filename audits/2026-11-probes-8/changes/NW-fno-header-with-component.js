// focus-not-obscured-minimum: an opaque sticky <header style="background:#fff"> whose content is a web component (logo/nav drawn in its shadow root).
// New: the hit test drills into the component's shadow root, and dom.contains(header, nodeInShadow) is false, so those points don't count as covered.
const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum', 'focus-not-obscured-enhanced'];
const links = Array.from({ length: 80 }, (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`).join('');
const bar = `customElements.define('x-bar', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<div style="height:60px;background:#fff">Site title and navigation drawn by a component</div>'; } });`;
(async () => {
  for (const core of ['old', 'new']) {
    show('opaque header, plain text (' + core + ')', await run(`<style>body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff"><div style="height:60px">Site</div></header>${links}`, R, { core }));
    show('opaque header holding a component (' + core + ')', await run(`<style>body{margin:0}</style><script>${bar}</script><header style="position:sticky;top:0;height:60px;background:#fff"><x-bar></x-bar></header>${links}`, R, { core }));
  }
  await close();
})();
