const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff} ${css}</style></head><body>${body}</body></html>`;
const R = ['contrast-minimum', 'contrast-computable'];
export default [
  { name: 'P1 default placeholder', html: H('', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P2 placeholder color #bbb', html: H('#a::placeholder{color:#bbb}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P3 field bg grey default placeholder', html: H('#a{background:#ddd}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P4 field color light (not placeholder)', html: H('#a{color:#ccc}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P5 placeholder opacity .5 only', html: H('#a::placeholder{opacity:.5}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P6 dark scheme default placeholder', html: H(':root{color-scheme:dark}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P7 placeholder color equals browser default (#757575) explicitly', html: H('#a::placeholder{color:#757575}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P8 textarea placeholder light', html: H('#a::placeholder{color:#ccc}', '<label>N <textarea id=a placeholder="Message"></textarea></label>'), rules: R, sample: ['#a'] },
  { name: 'P9 field border changed only (bg default)', html: H('#a{border:2px solid #000;border-radius:4px}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P10 field transparent bg on dark page, default ph', html: H('body{background:#222;color:#fff} #a{background:transparent;color:#fff}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P11 field font bigger, default ph colors', html: H('#a{font-size:20px}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P12 input with value and light placeholder', html: H('#a::placeholder{color:#ccc}', '<label>N <input id=a value="Bob" placeholder="Your name"></label>'), rules: R },
  { name: 'P13 color: light; placeholder inherits? (ph uses darkgray default)', html: H('#a{color:#999}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P14 field bg white explicit, default ph', html: H('#a{background:#fff}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P15 field bg #f8f8f8 + default ph', html: H('#a{background:#f8f8f8}', '<label>N <input id=a placeholder="Your name"></label>'), rules: R, sample: ['#a'] },
  { name: 'P16 search input default', html: H('', '<label>N <input type=search id=a placeholder="Search"></label>'), rules: R, sample: ['#a'] },
  { name: 'P17 aria-label no visible label, ph light', html: H('#a::placeholder{color:#aaa}', '<input id=a aria-label=Search placeholder="Search">'), rules: R },
  { name: 'P18 disabled input light ph', html: H('#a::placeholder{color:#ccc}', '<label>N <input id=a disabled placeholder="Your name"></label>'), rules: R },
  { name: 'P19 readonly input light ph', html: H('#a::placeholder{color:#ccc}', '<label>N <input id=a readonly placeholder="Your name"></label>'), rules: R },
  { name: 'P20 contenteditable data-placeholder', html: H('#a:empty::before{content:attr(data-placeholder);color:#bbb}', '<div id=a contenteditable role=textbox aria-label=N data-placeholder="Type here"></div>'), rules: R },
];
