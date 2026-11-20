// Which jsdom windows survive a scan: WeakRefs to every window made.
const J = require('/home/user/core/node_modules/jsdom');
const Orig = J.JSDOM;
const refs = [];
J.JSDOM = class extends Orig { constructor(...a) { super(...a); refs.push(new WeakRef(this.window)); } };
const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const pages = require('./pages.js');
for (let i = 1; i <= 4; i++) {
  runa11yCoreOnHtml(pages.fixture, {});
  global.gc(); global.gc();
  console.log(i, 'windows made', refs.length, 'alive', refs.filter((r) => r.deref()).length, 'heapMB', Math.round(process.memoryUsage().heapUsed / 1e6));
}
