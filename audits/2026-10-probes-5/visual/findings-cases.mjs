// One minimal repro per confirmed finding that fits the case format (VI-n in FINDINGS.md).
// Run: node cases.mjs ./findings-cases.mjs   (engine + pixels)
const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px Arial;background:#fff;color:#000} ${css}</style></head><body>${body}</body></html>`;
const L = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const C = ['contrast-minimum', 'contrast-computable'];
const opts = '<option>First choice</option><option>Second</option>';
export default [
  { name: 'VI-1 native select #767676', html: H('#a{color:#767676}', `<label>Country <select id=a>${opts}</select></label>`), rules: C, sample: ['#a'] },
  { name: 'VI-2 base-select #aaa no author button', html: H('#a,#a::picker(select){appearance:base-select} #a{color:#aaa}', `<label>Country <select id=a>${opts}</select></label>`), rules: C, sample: ['#a'] },
  { name: 'VI-3 background-clip:text solid black', html: H('#a{background:#000;-webkit-background-clip:text;background-clip:text;color:transparent;font-size:32px}', '<h1 id=a>Clipped heading</h1>'), rules: C, sample: ['#a'] },
  { name: 'VI-3b -webkit-text-fill-color transparent + clip text', html: H('#a{background-color:#222;-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:32px}', '<h1 id=a>Fill transparent</h1>'), rules: C, sample: ['#a'] },
  { name: 'VI-4a spacing clip, no zoom', html: H('body{line-height:1.2} #a{width:200px;height:40px;overflow:hidden}', '<div id=a>Two lines only of text here ok</div>'), rules: ['text-spacing-content-loss'] },
  { name: 'VI-4b spacing clip, html zoom .8', html: H('html{zoom:.8} body{line-height:1.2} #a{width:200px;height:40px;overflow:hidden}', '<div id=a>Two lines only of text here ok</div>'), rules: ['text-spacing-content-loss'] },
  { name: 'VI-4c spacing clip, zoom 2 container', html: H('body{line-height:1.2} #z{zoom:2} #a{width:200px;height:40px;overflow:hidden}', '<div id=z><div id=a>Two lines only of text here ok</div></div>'), rules: ['text-spacing-content-loss'] },
  { name: 'VI-4d clearfix overflow hidden, html zoom 1.25', html: H('html{zoom:1.25} body{line-height:1.2} .cf{overflow:hidden;width:600px}', `<div class=cf><p>${L.repeat(3)}</p><p>${L}</p></div><div class=cf><p>${L.repeat(2)}</p></div>`), rules: ['text-spacing-content-loss'] },
  { name: 'VI-7 inline buttons in a sentence', html: H('p{font-size:12px} p button{all:unset;color:#00e;text-decoration:underline;cursor:pointer}', '<p>Choose <button>yes</button>/<button>no</button> for this sentence of text.</p>'), rules: ['target-size-minimum'] },
  { name: 'VI-7 control: same with links', html: H('p{font-size:12px}', '<p>Choose <a href=#y>yes</a>/<a href=#n>no</a> for this sentence of text.</p>'), rules: ['target-size-minimum'] },
  { name: 'VI-10a menu scale(0)', html: H('#m{transform:scale(0)}', '<nav id=m aria-label=Menu><a href=/a>A</a><a href=/b>B</a></nav><main><p>x</p></main>'), rules: ['css-hidden-focus'] },
  { name: 'VI-10b slide in overflow-x:clip track', html: H('.track{overflow-x:clip;width:300px;white-space:nowrap} .slide{display:inline-block;width:300px}', '<div class=track><div class=slide><a href=/1>One</a></div><div class=slide><a href=/2>Two</a></div></div>'), rules: ['css-hidden-focus'] },
  { name: 'VI-10c !important hiding beats :focus', html: H('.skip{position:absolute!important;top:-40px!important} .skip:focus{top:0}', '<a class=skip href=#main>Skip</a><main id=main>x</main>'), rules: ['css-hidden-focus'] },
  { name: 'VI-11a CSS nesting &:focus brings skip link in', html: H('.skip{position:absolute;top:-40px; &:focus{top:0}}', '<a class=skip href=#main>Skip</a><main id=main>x</main>'), rules: ['css-hidden-focus'] },
  { name: 'VI-11b :has(:focus) slides menu in', html: H('nav{position:fixed;top:0;left:0;transform:translateX(-100%)} body:has(nav a:focus) nav{transform:none}', '<nav aria-label=m><a href=/a>A</a></nav><main>x</main>'), rules: ['css-hidden-focus'] },
  { name: 'VI-12a own text-indent -9999px', html: H('#a{text-indent:-9999px;color:#eee}', '<p id=a>Hidden text</p>'), rules: C, sample: ['#a'] },
  { name: 'VI-12b ::before text-indent -9999px', html: H('#a::before{content:"Hidden";color:#eee;display:inline-block;text-indent:-9999px}', '<p id=a>Main text</p>'), rules: C },
  { name: 'VI-13 font-size-adjust 24px painted ~14px', html: H('#a{font-size:24px;font-size-adjust:0.3;color:#949494}', '<p id=a>Sample text here</p>'), rules: C },
];
