const H = (head, body, htmlAttr = '') => `<!doctype html><html lang=en ${htmlAttr}><head><title>t</title><style>${head}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'C1 plain page grey text', html: H('p{color:#999}', '<p id=a>grey on canvas</p>'), rules: R, sample: ['#a'] },
  { name: 'C2 color-scheme dark no bg, light text', html: H(':root{color-scheme:dark}', '<p id=a>default text</p>'), rules: R, sample: ['#a'] },
  { name: 'C3 color-scheme dark, dark grey text', html: H(':root{color-scheme:dark} p{color:#555}', '<p id=a>dark text on dark canvas</p>'), rules: R, sample: ['#a'] },
  { name: 'C4 meta color-scheme dark', html: '<!doctype html><html lang=en><head><title>t</title><meta name=color-scheme content=dark><style>p{color:#333}</style></head><body><p id=a>text</p></body></html>', rules: R, sample: ['#a'] },
  { name: 'C5 light dark meta, prefers dark', html: '<!doctype html><html lang=en><head><title>t</title><meta name=color-scheme content="light dark"><style>p{color:#333}</style></head><body><p id=a>text</p></body></html>', rules: R, sample: ['#a'], context: { colorScheme: 'dark' } },
  { name: 'C6 light-dark() color, prefers dark', html: H(':root{color-scheme:light dark} p{color:light-dark(#333,#444)}', '<p id=a>text</p>'), rules: R, sample: ['#a'], context: { colorScheme: 'dark' } },
  { name: 'C7 translucent body bg rgba(0,0,0,.5)', html: H('body{background:rgba(0,0,0,.5)} p{color:#000}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C8 translucent html bg dark scheme', html: H(':root{color-scheme:dark;background:rgba(255,255,255,.1)} p{color:#555}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C9 body bg propagates, html none', html: H('body{background:#333} p{color:#555}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C10 html bg + body bg different', html: H('html{background:#000} body{background:#fff;margin:0;height:50px} p{color:#888;margin:0;position:relative;top:100px}', '<p id=a>text below body</p>'), rules: R, sample: ['#a'] },
  { name: 'C11 body bg only, body short, text overflow body', html: H('body{background:#000;margin:0;height:20px} p{color:#888;margin:0;position:relative;top:100px}', '<p id=a>text below body</p>'), rules: R, sample: ['#a'] },
  { name: 'C12 iframe transparent dark text over dark parent', html: H('body{background:#000;color:#fff}', `<iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><body style='color:#333'><p>inner text</p></body></html>"></iframe>`), rules: R, sample: ['iframe'] },
  { name: 'C13 iframe dark parent, color-scheme dark in parent, iframe light scheme', html: H(':root{color-scheme:dark}', `<iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><body style='color:#222'><p>inner text</p></body></html>"></iframe>`), rules: R, sample: ['iframe'] },
  { name: 'C14 iframe parent white, iframe scheme dark', html: H('body{background:#fff}', `<iframe style="border:0" srcdoc="<!doctype html><html lang=en><title>f</title><style>:root{color-scheme:dark}</style><body><p style='color:#333'>inner text</p></body></html>"></iframe>`), rules: R, sample: ['iframe'] },
  { name: 'C15 html filter invert', html: H('html{filter:invert(1)} p{color:#999}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C16 body opacity .5 no bg', html: H('body{opacity:.5} p{color:#000}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
  { name: 'C17 html opacity .3 with bg black', html: H('html{background:#000;opacity:.3} p{color:#fff}', '<p id=a>text</p>'), rules: R, sample: ['#a'] },
];
