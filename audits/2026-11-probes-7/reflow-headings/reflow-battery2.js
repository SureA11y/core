const h = require('./harness');
const R = 'reflow-horizontal-scroll';
const D = '<!doctype html><html><head><meta charset=utf-8></head>';
const cases = [
 ['shell-full', D+`<style>html,body{height:100%;overflow:hidden;margin:0}.app{height:100%;overflow:auto}</style><body><div class=app><div style="width:600px">Wide text content here</div></div></body>`],
 ['shell-header-main', D+`<style>html,body{height:100%;overflow:hidden;margin:0}.app{display:flex;flex-direction:column;height:100%}header{flex:0 0 56px;background:#eee}main{flex:1;overflow:auto}</style><body><div class=app><header>App</header><main><div style="width:600px">Wide text content here</div></main></div></body>`],
 ['shell-header-main-field', D+`<style>html,body{height:100%;overflow:hidden;margin:0}.app{display:flex;flex-direction:column;height:100%}header{flex:0 0 56px;background:#eee}main{flex:1;overflow:auto}</style><body><div class=app><header>App</header><main><form style="display:flex"><input style="width:200px"><input style="width:200px"></form></main></div></body>`],
 ['shell-sidebar-main', D+`<style>html,body{height:100%;overflow:hidden;margin:0}.app{display:flex;height:100%}aside{flex:0 0 0px}main{flex:1;overflow:auto}</style><body><div class=app><aside></aside><main><div style="width:600px">Wide text content here</div></main></div></body>`],
 ['body-own-scroll-margin', D+`<html style="overflow-x:hidden"><body style="overflow-x:auto"><div style="width:500px">Wide</div></body></html>`],
 ['body-own-scroll-nomargin', D+`<html style="overflow-x:hidden"><body style="overflow-x:auto;margin:0"><div style="width:500px">Wide</div></body></html>`],
 ['html-oy-scroll-body-ox-hidden', D+`<html style="overflow-y:scroll"><body style="overflow-x:hidden"><div style="width:500px">Wide text here</div></body></html>`],
 ['body-ox-hidden', D+`<body style="overflow-x:hidden"><div style="width:500px">Wide text here</div></body>`],
 ['peek-carousel-hidden', D+`<div style="overflow:hidden"><div style="display:flex;gap:8px">${[1,2,3].map(i=>`<div style="flex:0 0 85%"><p>Slide ${i} text</p></div>`).join('')}</div></div>`],
 ['sticky-in-scroll-table', D+`<div style="overflow-x:auto"><table><thead><tr><th style="position:sticky;left:0">Name</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>x</td><td style="min-width:200px">1</td><td style="min-width:200px">2</td></tr></tbody></table></div>`],
 ['scroll-box-single-item-wide-two-children', D+`<div style="overflow-x:auto"><div style="display:flex;width:600px"><p style="width:250px">Paragraph one of a wide two-column article layout.</p><p style="width:250px">Paragraph two of a wide two-column article layout.</p></div></div>`],
 ['fixed-start-negative', D+`<div style="margin-left:-40px">Text pushed past the start edge with a negative margin here</div>`],
 ['sr-only-right', D+`<a href="#m" style="position:absolute;left:100%;">Skip</a><p>x</p>`],
 ['input-100pct-padding', D+`<input style="width:100%;padding:8px">`],
 ['svg-text-past', D+`<svg width="300" height="40" style="overflow:visible"><text x="250" y="20">long svg label text</text></svg>`],
 ['abs-in-relative-hidden-tooltip', D+`<div style="position:relative;overflow:hidden;width:200px">Box <span style="position:absolute;left:150px;width:200px">Tooltip text</span></div>`],
 ['ellipsis-block-child', D+`<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:200px">A long line of text that is truncated with an ellipsis here</div>`],
 ['ellipsis-inline-span', D+`<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:200px"><span>A long line of text that is truncated with an ellipsis here</span></div>`],
 ['ellipsis-inline-block-span', D+`<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:200px"><a style="display:inline-block">A long link</a> <span>more and more text that is truncated</span></div>`],
 ['line-clamp', D+`<p style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">Long text long text long text long text long text long text long text long text long text long text long text</p>`],
];
(async () => {
  const only = process.argv[2];
  for (const [name, html] of cases) {
    if (only && !name.includes(only)) continue;
    try { const r = await h.runChromium(html, R); console.log(name.padEnd(45), r.outcome, JSON.stringify(r.occ)); }
    catch (e) { console.log(name, 'ERR', e.message); }
  }
  await h.close();
})();
