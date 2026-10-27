const P = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.4 Arial;background:#fff;color:#000} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'V1 abs left -10000', html: P('.vh{position:absolute;left:-10000px;color:#eee}', '<p>Text <span class=vh id=a>hidden label</span></p>'), rules: R },
  { name: 'V2 opacity 0', html: P('#a{opacity:0;color:#eee}', '<p id=a>faded</p>'), rules: R },
  { name: 'V3 height0 overflow hidden', html: P('#w{height:0;overflow:hidden}#a{color:#eee}', '<div id=w><p id=a>collapsed</p></div>'), rules: R },
  { name: 'V4 text-indent logo', html: P('h1 a{display:block;width:200px;height:50px;background:#c00;text-indent:-9999px;color:#fff;overflow:hidden}', '<h1><a href=/ id=a>Company</a></h1>'), rules: R },
  { name: 'V5 text-indent no overflow white on white', html: P('#a{text-indent:-9999px;color:#fff}', '<a href=/ id=a>Company</a>'), rules: R },
  { name: 'V6 covered by opaque sibling', html: P('#c{position:relative}#cover{position:absolute;inset:0;background:#000}#a{color:#eee}', '<div id=c><p id=a>covered text</p><div id=cover></div></div>'), rules: R },
  { name: 'V7 transform translateX(-200vw)', html: P('#a{transform:translateX(-200vw);color:#eee}', '<p id=a>moved away</p>'), rules: R },
  { name: 'V8 scale(0)', html: P('#a{transform:scale(0);color:#eee}', '<p id=a>scaled</p>'), rules: R },
  { name: 'V9 clip-path inset(50%)', html: P('#a{clip-path:inset(50%);color:#eee}', '<p id=a>clipped</p>'), rules: R },
  { name: 'V10 overflow scroll content below fold (visible by scroll)', html: P('#w{height:40px;overflow:auto}#a{color:#aaa;margin-top:100px}', '<div id=w><p>top</p><p id=a>scroll to me</p></div>'), rules: R },
  { name: 'V11 font-size 1px?', html: P('#a{font-size:1px;color:#eee}', '<p id=a>tiny</p>'), rules: R },
  { name: 'V12 color same as bg', html: P('#a{color:#fff}', '<p id=a>invisible white</p>'), rules: R },
  { name: 'V13 details closed', html: P('#a{color:#eee}', '<details><summary>S</summary><p id=a>inside</p></details>'), rules: R },
  { name: 'V14 width 1 clip auto', html: P('#a{position:absolute;width:1px;height:1px;overflow:hidden;color:#eee;white-space:nowrap}', '<p>x<span id=a>sr text here</span></p>'), rules: R },
];
