const h = require('./harness');
const R = 'reflow-horizontal-scroll';
const D = '<!doctype html><html><head><meta charset=utf-8></head>';
const LONG = 'const result = someFunction(argumentNumberOne, argumentNumberTwo, argumentNumberThree);';
const cases = [
 ['clippath-hidden-wide-abs', D+`<body><p>Page</p><div style="position:absolute;top:0;left:0;width:600px;clip-path:inset(50%)">Hidden panel text</div></body>`],
 ['clippath-reveal-menu', D+`<body><nav style="position:relative"><a href=#>Shop</a><div style="position:absolute;top:100%;left:0;width:600px;clip-path:inset(0 0 100% 0)">Mega menu panel <a href=#>Link</a></div></nav></body>`],
 ['visibility-hidden-control', D+`<body><nav style="position:relative"><a href=#>Shop</a><div style="position:absolute;top:100%;left:0;width:600px;visibility:hidden">Mega menu panel <a href=#>Link</a></div></nav></body>`],
 ['maxheight0-menu', D+`<body><nav style="position:relative"><a href=#>Shop</a><div style="position:absolute;top:100%;left:0;width:600px;max-height:0;overflow:hidden">Mega menu panel <a href=#>Link</a></div></nav></body>`],
 ['clip-rect-wide-abs', D+`<body><p>Page</p><div style="position:absolute;top:0;left:0;width:600px;clip:rect(0 0 0 0)">Hidden text</div></body>`],
 ['codemirror-like', D+`<body><div class=cm-editor><div class=cm-scroller style="overflow:auto;display:flex"><div class=cm-gutters style="flex:none">1</div><div class=cm-content contenteditable=true role=textbox aria-multiline=true style="white-space:pre;flex-grow:2"><div class=cm-line>${LONG}</div></div></div></div></body>`],
 ['codemirror-like-in-pre-class', D+`<body><div style="overflow-x:auto"><div contenteditable=true style="white-space:pre;display:inline-block;min-width:100%">${LONG}</div></div></body>`],
 ['textarea-wrap-off', D+`<body><textarea wrap=off style="width:100%;box-sizing:border-box">${LONG}</textarea></body>`],
 ['rte-editable-overflow', D+`<body><div contenteditable=true style="overflow-x:auto;border:1px solid"><p>Some text</p><p style="width:500px">A wide paragraph in a rich text editor</p></div></body>`],
 ['html-rtl-body-ltr-wide', D.replace('<html>','<html dir=rtl>')+`<body dir=ltr><div style="width:500px">Wide</div></body>`],
 ['html-ltr-body-rtl-wide', D+`<body dir=rtl><div style="width:500px">Wide</div></body>`],
 ['abs-escapes-scrollbox', D+`<body><div style="overflow-x:auto"><p>Box</p><div style="position:absolute;top:50px;left:200px;width:300px">Escaping tooltip</div></div></body>`],
 ['combobox-listbox-scroll', D+`<body><div role=listbox style="overflow:auto;max-height:100px;width:200px"><div role=option style="white-space:nowrap">A very long option label that does not wrap at all</div></div></body>`],
 ['select-wide-native', D+`<body><select><option>A very very long option label that makes the select wide indeed</option></select></body>`],
];
(async () => {
  const only = process.argv[2];
  for (const [name, html] of cases) {
    if (only && !name.includes(only)) continue;
    try { const r = await h.runChromium(html, R, { after: () => [document.scrollingElement.scrollWidth, document.scrollingElement.clientWidth] }); console.log(name.padEnd(32), r.outcome, JSON.stringify(r.extra), JSON.stringify(r.occ)); }
    catch (e) { console.log(name, 'ERR', e.message); }
  }
  await h.close();
})();
