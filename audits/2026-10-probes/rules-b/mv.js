const h = require('./h.js'); const { jscan } = require('./j.js');
const R = ['meta-viewport-zoom-enabled','meta-viewport-large'];
const vps = ['width=device-width, initial-scale=1', 'user-scalable=no', 'user-scalable=0', 'user-scalable=NO', 'user-scalable=yes', 'maximum-scale=1', 'maximum-scale=1.0', 'maximum-scale=1.99', 'maximum-scale=2', 'maximum-scale=2.0', 'maximum-scale=5', 'maximum-scale=10', 'width=device-width;maximum-scale=1', 'maximum-scale = 1', 'maximum-scale=1e0', 'maximum-scale=-1', 'maximum-scale=abc', 'user-scalable=-1', 'user-scalable=1', 'user-scalable=0.5', 'minimum-scale=3, maximum-scale=1', 'initial-scale=1;user-scalable=no'];
(async () => {
  for (const v of vps) {
    const html = `<!doctype html><html lang=en><head><title>t</title><meta name="viewport" content="${v}"></head><body><p>x</p></body></html>`;
    const a = await h.scan(html, { rules: R }); const b = jscan(html, { rules: R });
    console.log(v.padEnd(36), R.map(id => `${id.replace('meta-viewport-','')}=${a[id] && a[id].outcome}/${b[id] && b[id].outcome} ${a[id] ? a[id].occ.map(o=>o.rc).join(',') : ''}`).join('  '));
  }
  const two = `<!doctype html><html lang=en><head><title>t</title><meta name="viewport" content="width=device-width"><meta name="viewport" content="user-scalable=no"></head><body><p>x</p></body></html>`;
  const two2 = `<!doctype html><html lang=en><head><title>t</title><meta name="viewport" content="user-scalable=no"><meta name="viewport" content="width=device-width"></head><body><p>x</p></body></html>`;
  console.log('two (last disables)', JSON.stringify((await h.scan(two, { rules: R }))['meta-viewport-zoom-enabled'].outcome));
  console.log('two (first disables)', JSON.stringify((await h.scan(two2, { rules: R }))['meta-viewport-zoom-enabled'].outcome));
  await h.close();
})();
