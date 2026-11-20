const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const pages = require('./pages.js');
const heap = () => { global.gc(); global.gc(); return Math.round(process.memoryUsage().heapUsed / 1e6); };
(async () => {
  console.log('start', heap());
  for (let i = 1; i <= 20; i++) {
    runa11yCoreOnHtml(pages.fixture, {});
    await new Promise((r) => setImmediate(r));
    console.log(i, 'heapMB', heap());
  }
})();
