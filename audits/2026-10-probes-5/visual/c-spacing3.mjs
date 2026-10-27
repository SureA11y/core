const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial;margin:8px} ${css}</style></head><body>${body}</body></html>`;
const R = ['text-spacing-content-loss'];
const long = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
const page = `<div class=cf><p>${long.repeat(3)}</p><p>${long}</p></div><div class=cf><p>${long.repeat(2)}</p></div>`;
export default [
  { name: 'Q1 clearfix overflow hidden, no zoom', html: H('.cf{overflow:hidden;width:600px}', page), rules: R },
  { name: 'Q2 clearfix overflow hidden, html zoom 1.25', html: H('html{zoom:1.25} .cf{overflow:hidden;width:600px}', page), rules: R },
  { name: 'Q3 clearfix overflow hidden, html zoom 0.8', html: H('html{zoom:.8} .cf{overflow:hidden;width:600px}', page), rules: R },
  { name: 'Q4 fixed-height clip, html zoom .8 (should fail/ask)', html: H('html{zoom:.8} #a{width:200px;height:40px;overflow:hidden}', '<div id=a>Two lines only of text here ok</div>'), rules: R },
  { name: 'Q5 fixed-height clip, scale .8', html: H('#w{transform:scale(.8);transform-origin:0 0} #a{width:200px;height:40px;overflow:hidden}', '<div id=w><div id=a>Two lines only of text here ok</div></div>'), rules: R },
];
