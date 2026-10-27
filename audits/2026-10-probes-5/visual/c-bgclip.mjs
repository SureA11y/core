const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:bold 32px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'K14 background-clip:text solid dark', html: H('#a{background:#000;-webkit-background-clip:text;background-clip:text;color:transparent}', '<h1 id=a>Clipped solid</h1>'), rules: R, sample: ['#a'] },
  { name: 'K14b one-colour gradient clip text', html: H('#a{background-image:linear-gradient(#123,#123);-webkit-background-clip:text;background-clip:text;color:transparent}', '<h1 id=a>Gradient one colour</h1>'), rules: R, sample: ['#a'] },
  { name: 'K14c text-fill transparent only, clip text, dark bg colour', html: H('#a{background-color:#222;-webkit-background-clip:text;-webkit-text-fill-color:transparent}', '<h1 id=a>Fill transparent</h1>'), rules: R, sample: ['#a'] },
  { name: 'K14d light clipped solid on white (true fail)', html: H('#a{background:#ddd;-webkit-background-clip:text;background-clip:text;color:transparent}', '<h1 id=a>Pale clipped</h1>'), rules: R, sample: ['#a'] },
  { name: 'K14e dark page, white clip text', html: H('body{background:#000} #a{background:#fff;-webkit-background-clip:text;background-clip:text;color:transparent}', '<h1 id=a>White on black</h1>'), rules: R, sample: ['#a'] },
];
