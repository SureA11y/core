const h = require('./h');
(async () => {
  const { r, page } = await h.run('<p id=t style="color:#777;background:#fff;font-size:16px">Hello world text</p>', ['contrast-minimum','contrast-computable'], {}, { keep: true });
  h.show(r, true);
  console.log(await h.pixels(page, { x: 0, y: 0, width: 200, height: 40 }));
  await h.close();
})();
