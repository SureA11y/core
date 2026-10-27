// Where does runOne spend its time on gen(12)?
const { gen } = require('./gen5.js'); const { buildKeep, serialise } = require('./check5.js'); const { runa11yCoreOnDom } = require('/home/user/core/src/testing.js'); console.warn = () => {};
const c = gen(12); const eo = { locale: 'ja' };
let t = Date.now(); const dom = buildKeep(c); console.log('build', Date.now() - t);
dom.window.__a11ycoreEngineOptions = eo; dom.window.document.__a11ycoreEngineOptions = eo;
t = Date.now(); const before = serialise(dom.window.document); console.log('ser1', Date.now() - t);
t = Date.now(); const res = runa11yCoreOnDom(dom, { engineOptions: eo, entryPointParity: false, runOnly: null }); console.log('scan', Date.now() - t);
t = Date.now(); const after = serialise(dom.window.document); console.log('ser2', Date.now() - t, before === after);
t = Date.now(); dom.window.close(); console.log('close', Date.now() - t);
