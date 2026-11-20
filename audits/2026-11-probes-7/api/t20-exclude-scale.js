const { runa11yCoreOnHtml } = require('/home/user/core/src/testing.js');
const html = '<html lang="en"><head><title>t</title></head><body><main><img src="a"><button></button></main></body></html>';
(async () => {
  for (const n of [0, 2500, 5000, 10000, 20000]) {
    const t = Date.now();
    const r = await runa11yCoreOnHtml(html, { engineOptions: { excludeSelectors: Array.from({ length: n }, (_, i) => '.c' + i) }, runOnly: process.argv[2] ? [process.argv[2]] : undefined });
    console.log(n, Date.now() - t, 'ms');
    await new Promise(r => setImmediate(r));
  }
})();
