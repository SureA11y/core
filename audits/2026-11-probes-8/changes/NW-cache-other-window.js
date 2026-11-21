// Is window.__a11ycoreSharedCache removed from the scanned window when a different global window exists (Jest-like env)?
const { createDom, runa11yCoreOnDom } = require('/home/user/core-r8/src/testing.js');
const host = createDom('<!doctype html><html><body>host</body></html>');
global.window = host.window; global.document = host.window.document;
const dom = createDom('<!doctype html><html lang="en"><head><title>t</title></head><body><main><h1>x</h1><p>Content</p></main></body></html>');
const r = runa11yCoreOnDom(dom, { entryPointParity: false });
console.log('scan ok', r.checksResults.length, '| scanned window keeps cache:', !!dom.window.__a11ycoreSharedCache, '| global window has cache:', !!host.window.__a11ycoreSharedCache);
