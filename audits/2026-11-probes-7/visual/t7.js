const { run, show, close } = require('./h');
const R = ['focus-not-obscured-minimum','focus-not-obscured-enhanced'];
const links = Array.from({length: 80}, (_, i) => `<p><a href="#">Link ${i}</a></p>`).join('');
const hdr = (style) => `<header style="position:sticky;top:0;height:60px;background:#fff;${style||''}">Site</header>`;
const cases = {
  stickyNoPad: `<style>body{margin:0}</style>${hdr()}${links}`,
  stickyPad60: `<style>html{scroll-padding-top:60px}body{margin:0}</style>${hdr()}${links}`,
  stickyPad10pct: `<style>html{scroll-padding-top:10%}body{margin:0}</style>${hdr()}${links}`,
  stickyPadCalc: `<style>html{scroll-padding-top:calc(10% + 2px)}body{margin:0}</style>${hdr()}${links}`,
  stickyPadRem: `<style>html{scroll-padding-top:4rem}body{margin:0}</style>${hdr()}${links}`,
  stickyPadBlock: `<style>html{scroll-padding-block:60px 0}body{margin:0}</style>${hdr()}${links}`,
  semi: `<style>body{margin:0}</style>${hdr('background:rgba(255,255,255,.8)')}${links}`,
  shadowHeader: `<style>body{margin:0}</style><x-hd></x-hd>${links}<script>customElements.define('x-hd', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<style>:host{display:block;position:sticky;top:0}</style><header style="height:60px;background:#fff">Site</header>'}})</script>`,
  shadowHeaderInner: `<style>body{margin:0}</style><x-hd></x-hd>${links}<script>customElements.define('x-hd', class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<header style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff">Site</header>'}})</script>`,
};
(async () => {
  for (const [k, h] of Object.entries(cases)) show(k, await run(h, R, { eo: { wcagLevel: 'AAA' } }), true);
  await close();
})();
