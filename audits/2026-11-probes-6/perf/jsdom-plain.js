// jsdom alone, no core: windows made in a synchronous loop, closed, and how many survive.
const { JSDOM } = require('/home/user/core/node_modules/jsdom');
const html = require('./pages.js').fixture;
const refs = [];
const count = () => { global.gc(); global.gc(); return `alive ${refs.filter((r) => r.deref()).length}/${refs.length} heapMB ${Math.round(process.memoryUsage().heapUsed / 1e6)}`; };
for (let i = 0; i < 30; i++) { const d = new JSDOM(html, { pretendToBeVisual: true }); refs.push(new WeakRef(d.window)); d.window.close(); }
console.log('sync loop:', count());
setImmediate(() => { console.log('after one yield:', count()); });
