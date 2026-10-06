const p=require('./h.js');
const R=['svg-text-alternative-present','role-img-text-alternative-present','canvas-text-alternative-present','embed-text-alternative-present'];
const cases=[
 ['svg title in g','<svg role="img"><g><title>Foo</title><circle r="5"/></g></svg>'],
 ['svg title after','<svg role="img"><circle r="5"/><title>Foo</title></svg>'],
 ['svg TITLE in foreignObject','<svg role="img"><foreignObject><title>x</title></foreignObject></svg>'],
 ['svg in link with text','<a href="/"><svg><title>Home icon</title><path d="M0 0"/></svg>Home</a>'],
 ['svg desc only aria-hidden','<svg aria-hidden="true"><desc>x</desc></svg>'],
 ['svg role=img aria-label ws','<svg role="img" aria-label="  "></svg>'],
 ['svg role=img aria-labelledby title','<svg role="img" aria-labelledby="t1"><title id="t1">Chart</title></svg>'],
 ['svg focusable in button','<button><svg tabindex="0"><path d="M0 0"/></svg>Go</button>'],
 ['svg xlink:title','<svg role="img"><a xlink:href="#"><title>x</title></a></svg>'],
 ['embed type text/html','<embed src="page.html" type="text/html">'],
 ['canvas role=img with fallback','<canvas role="img">Chart of sales</canvas>'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title></head><body>${h}</body></html>`,R);
