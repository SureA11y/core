const { cases, close } = require('./multi');
const R = ['reflow-horizontal-scroll'];
const vp = '<meta name="viewport" content="width=device-width,initial-scale=1">';
(async () => {
await cases([
 ['long url', vp + `<p>See https://example.com/a/very/long/path/that/does/not/break/anywhere/at/all/ok for details.</p>`],
 ['long url overflow-wrap anywhere', vp + `<p style="overflow-wrap:anywhere">See https://example.com/a/very/long/path/that/does/not/break/anywhere/at/all/ok for details.</p>`],
 ['fixed width form', vp + `<form style="width:400px"><label>Name <input></label></form>`],
 ['img 600 no max-width', vp + `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='100'/%3E" alt="banner">`],
 ['grid minmax 200 x2', vp + `<div style="display:grid;grid-template-columns:200px 200px"><p>A column</p><p>B column</p></div>`],
 ['flex nowrap nav', vp + `<nav style="display:flex;gap:20px;white-space:nowrap"><a href="#">Home</a><a href="#">Products</a><a href="#">Solutions</a><a href="#">Contact us</a><a href="#">About</a></nav>`],
 ['100vw + margin', vp + `<div style="width:100vw;margin-left:20px;background:#eee">full bleed</div>`],
 ['vertical writing body', vp + `<body style="writing-mode:vertical-rl"><p>Vertical</p></body>`],
 ['rtl overflow left', vp + `<div dir="rtl"><div style="width:500px">عرض واسع</div></div>`],
 ['scrollbar-gutter stable', vp + `<style>html{scrollbar-gutter:stable}</style><div style="width:100%">fits</div>`],
], R, { viewport: { width: 320, height: 640 } });
await close();
})();
