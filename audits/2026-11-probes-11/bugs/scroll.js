const { both, page, close } = require('./h.js');
const ID='scrollable-region-focusable';
(async () => {
  const P = '<p>Texto largo</p>'.repeat(5);
  await both('overflow:auto height 80 inline style', page(`<div style="height:80px;overflow:auto">${P}</div>`), ID);
  await both('overflow:auto via class', page(`<div class=s>${P}</div>`, '<style>.s{height:80px;overflow:auto}</style>'), ID);
  await both('overflow-y:scroll', page(`<div style="height:80px;overflow-y:scroll">${P}</div>`), ID);
  await both('in article lang es', `<!doctype html><html lang="es"><head><title>x</title></head><body><main><article><div style="height:80px;overflow:auto">${P}</div></article></main></body></html>`, ID);
  await close();
})();
