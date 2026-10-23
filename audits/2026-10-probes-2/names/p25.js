const p=require('./h');
const L=['label-in-name','link-name-present','button-name-present'];
p('self-ref labelledby link','<h3 id="h">Pricing</h3><a id="l1" href="/p" aria-labelledby="l1 h">Read more</a>',L);
p('self-ref labelledby button w/ aria-label','<button id="b" aria-label="Delete" aria-labelledby="b f">Delete</button><span id="f">file.txt</span>',L);
p('self-ref labelledby button content','<button id="b" aria-labelledby="b f">Delete</button><span id="f">file.txt</span>',L);
p('self-ref only','<button id="b" aria-labelledby="b">Delete</button>',L);
p('labelledby ref with aria-labelledby chain','<button aria-labelledby="a">Go</button><span id="a" aria-labelledby="c">Go now</span><span id="c">Other</span>',L);
p('input self-ref','<label for="q" id="ql">Search</label><input id="q" aria-labelledby="ql q" value="cats">',L);
