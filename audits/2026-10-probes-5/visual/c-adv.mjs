const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff;margin:20px} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
const cv = '<canvas id=cv width=300 height=60 style="position:absolute;top:20px;left:20px"></canvas><script>const g=cv.getContext("2d");g.fillStyle="#000";g.fillRect(0,0,300,60)</script>';
export default [
  { name: 'X1 mix-blend-mode difference white text on white', html: H('#a{mix-blend-mode:difference;color:#fff}', '<p id=a>Blend difference</p>'), rules: R, sample: ['#a'] },
  { name: 'X2 mix-blend-mode multiply (no-op over white)', html: H('#a{mix-blend-mode:multiply;color:#767676}', '<p id=a>Multiply</p>'), rules: R, sample: ['#a'] },
  { name: 'X3 backdrop-filter blur over solid bg', html: H('.w{background:#036;padding:10px} .g{backdrop-filter:blur(4px);padding:6px} .g p{color:#fff}', '<div class=w><div class=g><p id=a>Glass</p></div></div>'), rules: R, sample: ['#a'] },
  { name: 'X4 text over <canvas> painted black', html: H('#a{position:relative;color:#fff;margin:0;padding:20px}', cv + '<p id=a>Over canvas</p>'), rules: R, sample: ['#a'] },
  { name: 'X5 text over video poster', html: H('.v{position:relative} video{display:block;width:300px;height:80px;background:#000} .v p{position:absolute;top:10px;left:10px;color:#fff;margin:0}', '<div class=v><video></video><p id=a>Over video</p></div>'), rules: R, sample: ['#a'] },
  { name: 'X6 opacity stacking .5 * .5 on black text', html: H('.o{opacity:.5}', '<div class=o><div class=o><p id=a>Nested opacity</p></div></div>'), rules: R, sample: ['#a'] },
  { name: 'X7 opacity on parent with own bg', html: H('.o{opacity:.5;background:#000;color:#fff;padding:4px}', '<div class=o><p id=a>Parent opacity bg</p></div>'), rules: R, sample: ['#a'] },
  { name: 'X8 clip-path circle on text bg', html: H('.c{background:#000;clip-path:circle(30%);color:#fff;padding:20px}', '<p class=c id=a>Clip circle text long enough</p>'), rules: R, sample: ['#a'] },
  { name: 'X9 color: currentcolor chain via border', html: H('.w{color:#ccc} .w p{color:currentcolor}', '<div class=w><p id=a>Chain</p></div>'), rules: R },
  { name: 'X10 filter: invert(1) on dark text dark bg', html: H('.f{filter:invert(1);background:#fff} .f p{color:#000}', '<div class=f><p id=a>Inverted</p></div>'), rules: R, sample: ['#a'] },
  { name: 'X11 filter brightness(0.5) on white bg region', html: H('.f{filter:brightness(.5);background:#fff} .f p{color:#767676}', '<div class=f><p id=a>Darkened</p></div>'), rules: R, sample: ['#a'] },
  { name: 'X12 text in img alt broken image', html: H('img{color:#ccc}', '<img id=a alt="Broken image alt text" src="data:image/png;base64,xx" width=200 height=30>'), rules: R },
  { name: 'X13 color via color(display-p3)', html: H('#a{color:color(display-p3 0.6 0.6 0.6)}', '<p id=a>P3 grey</p>'), rules: R, sample: ['#a'] },
  { name: 'X14 color via oklch', html: H('#a{color:oklch(70% 0 0)}', '<p id=a>OKLCH grey</p>'), rules: R, sample: ['#a'] },
  { name: 'X15 color via relative color from', html: H('#a{color:rgb(from #000 r g b / 40%)}', '<p id=a>Relative 40</p>'), rules: R, sample: ['#a'] },
  { name: 'X16 color-mix with transparency', html: H('#a{color:color-mix(in srgb, #000 40%, transparent)}', '<p id=a>Mix transparent</p>'), rules: R, sample: ['#a'] },
  { name: 'X17 light-dark() colour scheme light', html: H(':root{color-scheme:light dark} #a{color:light-dark(#aaa,#fff)}', '<p id=a>Light dark</p>'), rules: R, sample: ['#a'] },
  { name: 'X18 isolation + mix-blend on sibling under text', html: H('.w{position:relative;isolation:isolate;background:#fff} .s{position:absolute;inset:0;background:#000;mix-blend-mode:difference} .w p{position:relative;color:#fff}', '<div class=w><div class=s></div><p id=a>Text over blended sibling</p></div>'), rules: R, sample: ['#a'] },
];
