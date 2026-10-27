const H = (head, body, htmlAttr = '') => `<!doctype html><html lang=en ${htmlAttr}><head><title>t</title><style>${head}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'C20 body color-scheme dark only', html: H('body{color-scheme:dark}', '<p id=a>default text in dark body</p>'), rules: R, sample: ['#a'] },
  { name: 'C21 root dark, body light scheme no bg', html: H(':root{color-scheme:dark} body{color-scheme:light}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C22 root dark, prefers light, light-dark on html bg', html: H(':root{color-scheme:light dark;background:light-dark(#fff,#000)} p{color:#777}', '<p id=a>text</p>'), rules: R, sample: ['#a'], context: { colorScheme: 'dark' } },
  { name: 'C23 root "only light" with prefers dark', html: H(':root{color-scheme:only light} p{color:#777}', '<p id=a>text</p>'), rules: R, sample: ['#a'], context: { colorScheme: 'dark' } },
  { name: 'C24 meta light dark, prefers dark, text color CanvasText default', html: '<!doctype html><html lang=en><head><title>t</title><meta name=color-scheme content="light dark"></head><body><p id=a>text</p></body></html>', rules: R, sample: ['#a'], context: { colorScheme: 'dark' } },
  { name: 'C25 meta dark + inline link default color', html: '<!doctype html><html lang=en><head><title>t</title><meta name=color-scheme content="dark"></head><body><p>Read <a id=a href=#x>the link</a> here</p></body></html>', rules: R, sample: ['#a'] },
  { name: 'C26 html bg transparent, body bg rgba(0,0,0,.5), dark scheme', html: H(':root{color-scheme:dark} body{background:rgba(255,255,255,.5)} p{color:#fff}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
];
