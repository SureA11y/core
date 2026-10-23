const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;margin:0} ${css}</style></head><body>${body}<main id=main><p>Content <a href=#x>visible link</a></p></main></body></html>`;
const R = ['css-hidden-focus'];
const menu = '<nav id=m aria-label=Menu><a href=/a>A</a><a href=/b>B</a></nav>';
export default [
  { name: 'F1 menu left:-9999px', html: H('#m{position:absolute;left:-9999px}', menu), rules: R },
  { name: 'F2 menu fixed translateX(-100%)', html: H('#m{position:fixed;top:0;left:0;width:250px;height:100vh;transform:translateX(-100%)}', menu), rules: R },
  { name: 'F3 menu fixed right off translateX(100%) right:0', html: H('#m{position:fixed;top:0;right:0;width:250px;height:100vh;transform:translateX(100%)}', menu), rules: R },
  { name: 'F4 menu absolute right:-300px in body (creates scroll? overflow-x hidden body)', html: H('body{overflow-x:hidden} #m{position:absolute;top:0;right:-300px;width:250px}', menu), rules: R },
  { name: 'F5 menu absolute right:-300px, page scrolls horizontally (reachable)', html: H('#m{position:absolute;top:0;right:-300px;width:250px}', menu), rules: R },
  { name: 'F6 menu below the fold (normal, reachable by scroll)', html: H('#m{margin-top:3000px}', menu), rules: R },
  { name: 'F7 skip link slid in on focus', html: H('.skip{position:absolute;transform:translateY(-200%)} .skip:focus{transform:none}', '<a class=skip href=#main>Skip</a>'), rules: R },
  { name: 'F8 skip link top:-40px focus top:0', html: H('.skip{position:absolute;top:-40px} .skip:focus{top:0}', '<a class=skip href=#main>Skip</a>'), rules: R },
  { name: 'F9 skip link off, no focus rule', html: H('.skip{position:absolute;top:-40px}', '<a class=skip href=#main>Skip</a>'), rules: R },
  { name: 'F10 menu max-height:0 overflow hidden', html: H('#m{max-height:0;overflow:hidden}', menu), rules: R },
  { name: 'F11 menu clip-path inset(0 0 100% 0)', html: H('#m{clip-path:inset(0 0 100% 0)}', menu), rules: R },
  { name: 'F12 menu scale(0) on container', html: H('#m{transform:scale(0)}', menu), rules: R },
  { name: 'F13 menu fixed translateX(-100%), :focus-within slides in', html: H('#m{position:fixed;top:0;left:0;width:250px;height:100vh;transform:translateX(-100%)} #m:focus-within{transform:none}', menu), rules: R },
  { name: 'F14 menu fixed translateY(-100%) top header drawer', html: H('#m{position:fixed;top:0;left:0;right:0;transform:translateY(-100%)}', menu), rules: R },
  { name: 'F15 carousel slide in overflow hidden track', html: H('.track{overflow:hidden;width:300px;white-space:nowrap} .slide{display:inline-block;width:300px}', '<div class=track><div class=slide><a href=/1>One</a></div><div class=slide><a href=/2>Two</a></div></div>'), rules: R },
  { name: 'F16 overflow-x:clip track slide (no scroll on focus!)', html: H('.track{overflow-x:clip;width:300px;white-space:nowrap} .slide{display:inline-block;width:300px}', '<div class=track><div class=slide><a href=/1>One</a></div><div class=slide><a href=/2>Two</a></div></div>'), rules: R },
  { name: 'F17 menu behind opaque fixed header? z-index covered', html: H('#cover{position:fixed;inset:0 0 auto 0;height:60px;background:#fff;z-index:2} #m{position:fixed;top:0;z-index:1}', '<div id=cover></div>' + menu), rules: R },
  { name: 'F18 container opacity 0 (fade in on scroll)', html: H('#m{opacity:0}', menu), rules: R },
  { name: 'F19 container width 0 overflow visible (content still visible)', html: H('#m{width:0;height:0}', menu), rules: R },
  { name: 'F20 menu off via margin-left:-100vw (not positioned)', html: H('#m{margin-left:-100vw}', menu), rules: R },
  { name: 'F21 html dir rtl menu right:-9999px', html: H('#m{position:absolute;right:-9999px}', menu).replace('<html lang=en>', '<html lang=en>'), rules: R },
];
