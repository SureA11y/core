const h = require('./harness');
const R = 'reflow-horizontal-scroll';
const D = '<!doctype html><html><head><meta charset=utf-8></head>';
const cases = [
 ['slot-in-scrollbox', D+`<body><x-box id=h><div style="width:600px">Slotted wide text</div></x-box><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="overflow-x:auto"><slot></slot></div>'</script></body>`],
 ['slot-in-scrollbox-field', D+`<body><x-box id=h><form style="display:flex"><input style="width:200px"><input style="width:200px"></form></x-box><script>document.getElementById('h').attachShadow({mode:'open'}).innerHTML='<div style="overflow-x:auto"><slot></slot></div>'</script></body>`],
 ['closed-details-wide', D+`<body><details><summary>More</summary><div style="width:600px">Wide hidden</div></details></body>`],
 ['open-details-wide', D+`<body><details open><summary>More</summary><div style="width:600px">Wide shown</div></details></body>`],
 ['page-prescrolled', D+`<body><div style="width:600px">Wide</div><p>Text</p></body>`, () => window.scrollTo(200, 0)],
 ['rtl-box-prescrolled-field', D.replace('<html>','<html dir=rtl>')+`<body><div id=b style="overflow-x:auto"><form style="display:flex;gap:8px"><input style="width:200px"><input style="width:200px"></form></div></body>`, () => { document.getElementById('b').scrollLeft = -200; }],
 ['ltr-box-prescrolled-field', D+`<body><div id=b style="overflow-x:auto"><form style="display:flex;gap:8px"><input style="width:200px"><input style="width:200px"></form></div></body>`, () => { document.getElementById('b').scrollLeft = 200; }],
 ['hidden-until-found-wide', D+`<body><div hidden=until-found style="width:600px">Find me</div></body>`],
 ['flex-shrink-image', D+`<body><img alt=x style="max-width:100%;width:600px;height:20px"></body>`],
 ['negative-margin-fullbleed', D+`<body style="margin:0"><div style="padding:0 16px"><div style="margin:0 -16px;background:#eee">Full bleed</div></div></body>`],
 ['sticky-left-col-scrolltable', D+`<body><div style="overflow-x:auto"><table><tr><th style="position:sticky;left:0;background:#fff">Name</th><td style="min-width:300px">x</td><td style="min-width:300px">y</td></tr></table></div></body>`],
 ['transform-translate-off-right-in-hidden', D+`<body><div style="overflow:hidden"><div style="transform:translateX(50%)">Sliding panel text content that starts in view</div></div></body>`],
];
(async () => {
  const only = process.argv[2];
  for (const [name, html, before] of cases) {
    if (only && !name.includes(only)) continue;
    try { const r = await h.runChromium(html, R, { before, after: () => [document.scrollingElement.scrollWidth, document.scrollingElement.clientWidth] }); console.log(name.padEnd(36), r.outcome, JSON.stringify(r.extra), JSON.stringify(r.occ)); }
    catch (e) { console.log(name, 'ERR', e.message); }
  }
  await h.close();
})();
