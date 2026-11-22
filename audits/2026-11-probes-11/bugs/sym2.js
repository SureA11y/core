const { cr, js, rule, brief, page, close } = require('./h.js');
const ids = ['symbol-graphic-contrast','contrast-minimum'];
(async () => {
  const b = '<p style="color:#000">Price: <span style="color:#8a8a8a">$</span>45.00 per item, taxes included.</p>';
  const r = await cr(page(b), ids); const j = js(page(b), ids);
  for (const id of ids) console.log('chrome', id.padEnd(24), brief(rule(r, id)).slice(0, 300));
  for (const id of ids) console.log('jsdom ', id.padEnd(24), brief(rule(j, id)).slice(0, 300));
  await close();
})();
