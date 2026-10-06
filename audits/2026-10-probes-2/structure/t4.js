const p=require('./h.js');
const R=['meta-viewport-zoom-enabled'];
for (const c of ['width=device-width initial-scale=1 user-scalable=no','width=device-width initial-scale=1 maximum-scale=1','user-scalable=0','user-scalable=1','maximum-scale=10','maximum-scale = 1.0','user-scalable=yes, maximum-scale=-1','maximum-scale=1;','width=device-width\nuser-scalable=no'])
 p(JSON.stringify(c),`<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="${c}"></head><body><p>x</p></body></html>`,R);
