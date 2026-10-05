const h = require('./h.js'); const { jscan } = require('./j.js');
const R = ['contrast-minimum','contrast-computable','link-in-text-block','target-size-minimum','text-spacing-content-loss','css-orientation-lock','meta-viewport-zoom-enabled'];
const W = '<style>html{background:#fff}</style>';
const cases = {
  group_opacity: `<style>html{background:#000}</style><div style="opacity:.5"><p style="background:#fff;color:#000">Hello</p></div>`,
  positioned: `${W}<div style="position:relative"><div style="background:#000;height:100px"></div><p style="position:absolute;top:0;margin:0;color:#ddd">Hello on black</p></div>`,
  link: `${W}<p style="color:#000">Some text <a href="#" style="color:#333;text-decoration:none">link</a> more text</p>`,
  target: `${W}<button style="width:10px;height:10px;padding:0">x</button><button style="width:10px;height:10px;padding:0">y</button>`,
  spacing: `${W}<div style="height:20px;overflow:hidden;width:100px">Some text that wraps across lines for sure</div>`,
  orient: `${W}<style>@media (orientation:portrait){body{transform:rotate(90deg)}}</style><p>x</p>`,
  hidden_offscreen: `${W}<p style="position:absolute;left:-9999px;color:#eee">Hello</p>`,
};
(async () => {
  for (const [k, body] of Object.entries(cases)) {
    const a = await h.scan(body, { rules: R }); const b = jscan(body, { rules: R });
    for (const id of R) { const x = a[id], y = b[id]; if (!x || !y) continue; if (x.outcome === 'notApplicable' && y.outcome === 'notApplicable') continue;
      console.log(k.padEnd(16), id.padEnd(28), 'chromium=' + x.outcome + ' ' + x.occ.map(o=>o.rc).join(','), '| jsdom=' + y.outcome + ' ' + y.occ.map(o=>o.rc).join(','), y.margin ? 'jsdom-margin=' + JSON.stringify(y.margin) : ''); }
  }
  await h.close();
})();
