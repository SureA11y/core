// Bisect what makes jsdom's window.close() slow after a scan (harness question).
const { gen } = require('./gen5.js'); const { buildKeep, serialise } = require('./check5.js'); const { runa11yCoreOnDom } = require('/home/user/core/src/testing.js'); console.warn = () => {};
const c = gen(12);
const v = process.argv[2];
const d = buildKeep(c);
if (v.includes('s')) serialise(d.window.document);
if (v.includes('o')) { d.window.__a11ycoreEngineOptions = {}; }
if (v.includes('r')) runa11yCoreOnDom(d, { entryPointParity: false, engineOptions: v.includes('l') ? { locale: 'ja' } : {} });
const t = Date.now(); d.window.close(); console.log(v, 'close', Date.now() - t);
