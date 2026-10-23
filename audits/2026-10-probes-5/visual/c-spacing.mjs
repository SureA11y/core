const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial;margin:8px} ${css}</style></head><body>${body}</body></html>`;
const R = ['text-spacing-content-loss'];
const long = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
export default [
  { name: 'TS1 cookie banner body overflow hidden', html: H('body{overflow:hidden} #c{position:fixed;bottom:0;left:0;right:0;background:#eee;padding:10px}', `<main><p>${long}</p><div style="height:2000px"></div></main><div id=c role=dialog aria-label=Cookies><p>${long} ${long}</p><button>Accept</button></div>`), rules: R },
  { name: 'TS2 fixed height overflow hidden two lines', html: H('#a{width:200px;height:40px;overflow:hidden}', `<div id=a>${long}</div>`), rules: R },
  { name: 'TS3 ellipsis single line that fit before', html: H('#a{width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}', '<div id=a>Short label that fits fine</div>'), rules: R },
  { name: 'TS4 margin band: 5px room on right', html: H('#a{display:inline-block;overflow:hidden;white-space:nowrap;padding-right:0}', '<div id=a style="width:calc(var(--w))">x</div>'), rules: R, before: async (p) => { await p.evaluate(() => { const a = document.getElementById('a'); a.textContent = 'Word'; a.style.width = 'auto'; const w = a.getBoundingClientRect().width; a.style.width = (w + 30) + 'px'; }); } },
  { name: 'TS5 lh-based max-height clamp', html: H('#a{width:200px;max-height:2lh;overflow:hidden}', `<div id=a>${long}</div>`), rules: R },
  { name: 'TS6 em-based height single line', html: H('#a{width:400px;height:1.2em;overflow:hidden}', '<div id=a>One line of text here</div>'), rules: R },
  { name: 'TS7 app shell body 100vh hidden, main scrolls', html: H('html,body{height:100%;margin:0} body{overflow:hidden;display:flex;flex-direction:column} main{flex:1;overflow:auto}', `<header style="height:40px">Head</header><main>${('<p>' + long + '</p>').repeat(40)}</main>`), rules: R },
  { name: 'TS8 button fixed height overflow hidden one word', html: H('button{height:24px;overflow:hidden;width:80px}', '<button>Submit form now</button>'), rules: R },
  { name: 'TS9 zoom 2 container with fixed height overflow hidden', html: H('#z{zoom:2} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R },
  { name: 'TS10 overflow clip y only, x visible', html: H('#a{width:200px;height:2.4em;overflow-y:clip;overflow-x:visible}', `<div id=a>${long}</div>`), rules: R },
  { name: 'TS11 text in transform scale(.5) clipped box', html: H('#w{transform:scale(.5);transform-origin:0 0} #a{width:400px;height:40px;overflow:hidden}', '<div id=w><div id=a>Two lines only of text in this box here ok fine</div></div>'), rules: R },
];
