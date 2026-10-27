const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:bold 32px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'K1 transparent fill, black stroke 1px', html: H('#a{color:transparent;-webkit-text-stroke:1px #000}', '<p id=a>Outlined</p>'), rules: R, sample: ['#a'] },
  { name: 'K2 transparent fill, light stroke', html: H('#a{color:transparent;-webkit-text-stroke:1px #ccc}', '<p id=a>Outlined</p>'), rules: R, sample: ['#a'] },
  { name: 'K3 -webkit-text-fill-color transparent, color black, light stroke', html: H('#a{color:#000;-webkit-text-fill-color:transparent;-webkit-text-stroke:1px #ddd}', '<p id=a>Outlined</p>'), rules: R, sample: ['#a'] },
  { name: 'K4 white text dark halo shadow on white (halo OK per Understanding)', html: H('#a{color:#fff;text-shadow:0 0 2px #000,0 0 2px #000,0 0 2px #000,0 0 2px #000}', '<p id=a>Halo text</p>'), rules: R, sample: ['#a'] },
  { name: 'K5 white text, light shadow (fail)', html: H('#a{color:#fff;text-shadow:1px 1px 0 #ddd}', '<p id=a>Shadow text</p>'), rules: R, sample: ['#a'] },
  { name: 'K6 light text dark 1px stroke (outline around fill)', html: H('#a{color:#eee;-webkit-text-stroke:2px #000}', '<p id=a>Stroked</p>'), rules: R, sample: ['#a'] },
  { name: 'K7 webkit-text-fill-color light overrides dark color', html: H('#a{color:#000;-webkit-text-fill-color:#ccc}', '<p id=a>Fill colour</p>'), rules: R, sample: ['#a'] },
  { name: 'K8 webkit-text-fill-color dark overrides light color', html: H('#a{color:#ccc;-webkit-text-fill-color:#000}', '<p id=a>Fill colour</p>'), rules: R, sample: ['#a'] },
  { name: 'K9 currentcolor chain fill', html: H('#w{color:#ccc} #a{color:inherit;-webkit-text-fill-color:currentcolor}', '<div id=w><p id=a>Current</p></div>'), rules: R },
  { name: 'K10 text-shadow transparent (no effect)', html: H('#a{color:#ccc;text-shadow:0 0 0 transparent}', '<p id=a>Pale</p>'), rules: R },
  { name: 'K11 text-shadow offset far away (not halo)', html: H('#a{color:#ccc;text-shadow:200px 0 0 #000}', '<p id=a>Pale</p>'), rules: R },
  { name: 'K12 text-shadow with zero blur same as color', html: H('#a{color:#ccc;text-shadow:1px 1px 0 #ccc}', '<p id=a>Pale</p>'), rules: R },
  { name: 'K13 background-clip:text gradient', html: H('#a{background:linear-gradient(#ccc,#ddd);-webkit-background-clip:text;background-clip:text;color:transparent}', '<p id=a>Clipped</p>'), rules: R, sample: ['#a'] },
  { name: 'K14 background-clip:text solid dark', html: H('#a{background:#000;-webkit-background-clip:text;background-clip:text;color:transparent}', '<p id=a>Clipped solid</p>'), rules: R, sample: ['#a'] },
  { name: 'K15 text-stroke 0 width transparent fill', html: H('#a{color:transparent;-webkit-text-stroke:0 #000}', '<p id=a>Nothing</p>'), rules: R },
  { name: 'K16 paint-order stroke fill', html: H('#a{color:#fff;-webkit-text-stroke:4px #000;paint-order:stroke fill}', '<p id=a>Paint order</p>'), rules: R, sample: ['#a'] },
];
