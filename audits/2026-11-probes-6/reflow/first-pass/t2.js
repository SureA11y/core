const { page, runCases } = require('./harness');
const P = page;
const IMG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100"><rect width="800" height="100" fill="red"/></svg>');
const app = (inner) => P('html,body{height:100%;margin:0;overflow:hidden} #app{height:100%;overflow:auto}', `<div id="app">${inner}</div>`);
runCases([
  { name: 'wide img with src', html: P('', `<img id="i" src="${IMG}" alt="x">`) },
  { name: 'app shell: wide div', html: app('<div id="w" style="width:600px">Wide text content</div>') },
  { name: 'app shell: layout table', html: app('<table id="t" role="presentation" style="width:600px"><tr><td>a</td><td>b</td></tr></table>') },
  { name: 'app shell: wide img', html: app(`<img id="i" src="${IMG}" alt="x">`) },
  { name: 'no shell: layout table', html: P('', '<table id="t" role="presentation" style="width:600px"><tr><td>a</td><td>b</td></tr></table>') },
  { name: 'layout table in overflow-x:auto wrapper', html: P('', '<div style="overflow-x:auto"><table id="t" role="presentation" style="width:600px"><tr><td>Column one of the page layout</td><td>Column two</td></tr></table></div>') },
  { name: 'outer layout table > scroll box > wide form', html: P('', '<table role="presentation" style="width:100%"><tr><td><div style="overflow-x:auto;width:280px"><form id="f" style="width:600px"><input aria-label="a" style="width:250px"><input aria-label="b" style="width:250px"></form></div></td></tr></table>') },
  { name: 'same without outer table', html: P('', '<div style="overflow-x:auto;width:280px"><form id="f" style="width:600px"><input aria-label="a" style="width:250px"><input aria-label="b" style="width:250px"></form></div>') },
  { name: 'contain:paint clips wide content', html: P('', '<div style="contain:paint"><div id="w" style="width:600px">Wide content cut off by paint containment, the end is unreachable</div></div>') },
  { name: 'content-visibility:auto clips wide content', html: P('', '<section style="content-visibility:auto;contain-intrinsic-size:auto 100px"><div id="w" style="width:600px">Wide content cut off, the end of this sentence is unreachable</div></section>') },
  { name: 'clip-path inset(0) on wrapper', html: P('', '<div style="clip-path:inset(0)"><div id="w" style="width:600px">Wide</div></div>') },
  { name: 'ellipsis on card hides clipped form', html: P('.card{overflow:hidden;text-overflow:ellipsis;border:1px solid} .grid{display:flex;width:560px} .grid>div{flex:none;width:270px}', '<div class="card"><div class="grid" id="g"><div><label>Type <input></label></div><div><label>Direction <input></label></div></div></div>') },
  { name: 'same card without ellipsis', html: P('.card{overflow:hidden;border:1px solid} .grid{display:flex;width:560px} .grid>div{flex:none;width:270px}', '<div class="card"><div class="grid" id="g"><div><label>Type <input></label></div><div><label>Direction <input></label></div></div></div>') },
]);
