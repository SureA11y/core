const { run, show, close } = require('./h');
const R = ['contrast-minimum','contrast-enhanced','contrast-computable'];
const cases = {
  c4_54: `<p style="color:#767676">Hello world</p>`,
  c4_48: `<p style="color:#777777">Hello world</p>`,
  bold18_66: `<p style="color:#949494;font-size:18.66px;font-weight:700">Hello world</p>`,
  bold18_67: `<p style="color:#949494;font-size:18.67px;font-weight:700">Hello world</p>`,
  bold14pt: `<p style="color:#949494;font-size:14pt;font-weight:700">Hello world</p>`,
  size24: `<p style="color:#949494;font-size:24px">Hello world</p>`,
  size23_9: `<p style="color:#949494;font-size:23.9px">Hello world</p>`,
  zoom2: `<p style="color:#949494;font-size:12px;zoom:2">Hello world</p>`,
  disabled: `<button disabled style="color:#aaa;background:#fff;border:1px solid">Go</button>`,
  placeholder: `<input placeholder="Search" style="color:#000">`,
  bgImageOnly: `<div style="background:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');color:#fff;padding:10px">Over image</div>`,
  dark: { html: `<style>:root{color-scheme:light dark}@media (prefers-color-scheme:dark){body{background:#000;color:#333}}</style><p>Hello dark</p>`, colorScheme: 'dark' },
};
(async () => {
  for (const [k, c] of Object.entries(cases)) { const h = typeof c === 'string' ? c : c.html; show(k, await run(h, R, { colorScheme: c.colorScheme, eo: { wcagLevel: 'AAA' } }), true); }
  await close();
})();
