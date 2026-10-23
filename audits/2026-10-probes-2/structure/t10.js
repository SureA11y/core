const p=require('./h.js');
const R=['img-alt-present','object-text-alternative-present','embed-text-alternative-present','svg-text-alternative-present','svg-image-text-alternative-present','video-poster-text-alternative-present','canvas-text-alternative-present'];
const cases=[
 ['object','<object data="a.png" type="image/png" role="none presentation"></object>'],
 ['object single','<object data="a.png" type="image/png" role="none"></object>'],
 ['embed','<embed src="a.png" type="image/png" role="none presentation">'],
 ['embed single','<embed src="a.png" type="image/png" role="none">'],
 ['svg','<svg role="none presentation"><circle r="5"/></svg>'],
 ['svg img','<svg role="img"><circle r="5"/></svg>'],
 ['svg role="graphics-document img"','<svg role="graphics-document img"><circle r="5"/></svg>'],
 ['svg image','<svg><image href="a.png" role="none presentation"/></svg>'],
 ['video','<video poster="a.png" role="none presentation"></video>'],
 ['video single','<video poster="a.png" role="none"></video>'],
 ['canvas','<canvas role="foo none"></canvas>'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title></head><body>${h}</body></html>`,R);
