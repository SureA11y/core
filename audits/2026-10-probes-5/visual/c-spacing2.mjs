const H = (css, body) => `<!doctype html><html lang=en><head><title>t</title><style>body{font:16px/1.2 Arial;margin:8px} ${css}</style></head><body>${body}</body></html>`;
const R = ['text-spacing-content-loss'];
export default [
  { name: 'TS9a no zoom', html: H('#a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R, sample: ['#a'] },
  { name: 'TS9b zoom 2', html: H('#z{zoom:2} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R },
  { name: 'TS9f zoom 2 sampled', html: H('#z{zoom:2} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R, sample: ['#a'] },
  { name: 'TS9g no zoom unsampled', html: H('#a{width:200px;height:40px;overflow:hidden}', '<div id=z><div id=a>Two lines only of text here ok</div></div>'), rules: R },
  { name: 'TS9c zoom 1.5', html: H('#z{zoom:1.5} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R },
  { name: 'TS9d zoom on html 2', html: H('html{zoom:2} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R },
  { name: 'TS9e scale 2 transform', html: H('#z{transform:scale(2);transform-origin:0 0} #a{width:200px;height:40px;overflow:hidden}', `<div id=z><div id=a>Two lines only of text here ok</div></div>`), rules: R },
];
