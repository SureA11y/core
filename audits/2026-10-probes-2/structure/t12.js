const p=require('./h.js');
const R=['meta-viewport-zoom-enabled','meta-viewport-large'];
for (const c of ['user-scalable=false','user-scalable=0.5','maximum-scale=yes','user-scalable=NO'])
 p(JSON.stringify(c),`<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="${c}"></head><body><p>x</p></body></html>`,R);
p('scope',`<!doctype html><html lang="en"><head><title>t</title></head><body><my-tabs scope="page">x</my-tabs><table><tr><th scope=" col ">a</th></tr><tr><td>1</td></tr></table></body></html>`,['scope-attr-valid']);
