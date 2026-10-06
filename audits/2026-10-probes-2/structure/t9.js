const p=require('./h.js');
const R=['img-alt-present','area-alt-present','input-image-alt-present','server-side-image-map-absent'];
const cases=[
 ['img role="none presentation"','<img src="a.png" role="none presentation">'],
 ['img role="foo none"','<img src="a.png" role="foo none">'],
 ['img role=" none "','<img src="a.png" role=" none ">'],
 ['area case mismatch','<img src="a.png" alt="m" usemap="#Map"><map name="map"><area href="/x" shape="rect" coords="0,0,1,1"></map>'],
 ['area by id','<img src="a.png" alt="m" usemap="#b"><map name="a" id="b"><area href="/x" shape="rect" coords="0,0,1,1"></map>'],
 ['input image role none','<input type="image" src="a.png" role="none presentation">'],
 ['input image title','<input type="image" src="a.png" title="Go">'],
 ['input image value','<input type="image" src="a.png" value="Go">'],
 ['input image TYPE','<input type="IMAGE" src="a.png">'],
 ['ismap no a','<img src="a.png" alt="x" ismap>'],
 ['ismap in a','<a href="/m"><img src="a.png" alt="x" ismap></a>'],
 ['ismap in a no href','<a><img src="a.png" alt="x" ismap></a>'],
 ['ismap in button','<button><img src="a.png" alt="x" ismap></button>'],
 ['input image ismap?','<a href="/m"><input type="image" src="a.png" alt="x" ismap></a>'],
];
for (const [l,h] of cases) p(l,`<!doctype html><html lang="en"><head><title>t</title></head><body>${h}</body></html>`,R);
