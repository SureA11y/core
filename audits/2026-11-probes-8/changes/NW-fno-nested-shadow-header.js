// focus-not-obscured-minimum: a sticky header inside a shadow root, plain vs built from a nested component (<app-shell> -> <x-bar> whose shadow draws the bar)
const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum'];
const links = Array.from({ length: 80 }, (_, i) => `<p><a href="#" id="l${i}">Link ${i}</a></p>`).join('');
const bar = `customElements.define('x-bar', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<div style="height:60px;background:#fff">Site title</div>'; } });`;
const plainHost = `customElements.define('x-hdr', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<header style="position:sticky;top:0;height:60px;background:#fff">Site</header><slot></slot>'; } });`;
const nestedHost = `customElements.define('x-hdr', class extends HTMLElement { constructor(){ super(); this.attachShadow({mode:'open'}).innerHTML = '<header style="position:sticky;top:0;height:60px"><x-bar></x-bar></header><slot></slot>'; } });`;
const lightNested = `<header style="position:sticky;top:0;height:60px"><x-bar></x-bar></header>${links}`;
(async () => {
  for (const core of ['old', 'new']) {
    show('light header (' + core + ')', await run(`<style>body{margin:0}</style><header style="position:sticky;top:0;height:60px;background:#fff">Site</header>${links}`, R, { core }));
    show('shadow header, plain (' + core + ')', await run(`<style>body{margin:0}</style><script>${plainHost}</script><x-hdr>${links}</x-hdr>`, R, { core }));
    show('shadow header drawn by nested component (' + core + ')', await run(`<style>body{margin:0}</style><script>${bar}${nestedHost}</script><x-hdr>${links}</x-hdr>`, R, { core }));
    show('light header drawn by a component (' + core + ')', await run(`<style>body{margin:0}</style><script>${bar}</script>${lightNested}`, R, { core }));
  }
  await close();
})();
